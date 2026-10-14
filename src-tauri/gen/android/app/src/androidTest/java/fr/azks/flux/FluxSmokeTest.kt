package fr.azks.flux

import android.view.View
import android.view.ViewGroup
import android.webkit.WebView
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import android.graphics.Bitmap
import android.content.pm.ActivityInfo
import java.io.File
import org.junit.Test
import org.junit.Assert.assertTrue
import org.junit.runner.RunWith
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/** Read-only live Twitch integration, driven inside the actual Android WebView. */
@RunWith(AndroidJUnit4::class)
class FluxSmokeTest {
  private fun screenshot(name: String) {
    val instrumentation=InstrumentationRegistry.getInstrumentation()
    val dir=File(instrumentation.targetContext.getExternalFilesDir(null),"qa");dir.mkdirs()
    instrumentation.uiAutomation.takeScreenshot()?.let { bitmap ->
      File(dir,"$name.png").outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG,100,it) };bitmap.recycle()
    }
  }
  private fun findWebView(view: View): WebView? {
    if (view is WebView) return view
    if (view is ViewGroup) for(i in 0 until view.childCount) findWebView(view.getChildAt(i))?.let { return it }
    return null
  }
  private fun js(scenario: ActivityScenario<MainActivity>, code: String): String {
    val ready=CountDownLatch(1); var result="null"
    scenario.onActivity { activity ->
      val web=findWebView(activity.window.decorView)
      if(web==null) ready.countDown() else web.evaluateJavascript(code) { result=it;ready.countDown() }
    }
    assertTrue("WebView JS callback timeout",ready.await(15,TimeUnit.SECONDS));return result
  }
  private fun waitFor(scenario: ActivityScenario<MainActivity>, expression: String, seconds: Int=75) {
    val end=System.currentTimeMillis()+seconds*1000
    while(System.currentTimeMillis()<end){ if(js(scenario,expression)=="true")return;Thread.sleep(500) }
    throw AssertionError("Condition failed: $expression; page="+js(scenario,"document.body.innerText.slice(0,2000)"))
  }
  @Test fun livePlaybackAndNavigation() {
    // Do not close the last Tauri activity before AndroidJUnitRunner has reported results:
    // the native event loop exits the process when the last window is destroyed.
    val scenario = ActivityScenario.launch(MainActivity::class.java)
      waitFor(scenario,"!!document.querySelector('#root') && document.body.innerText.includes('FLUX')")
      js(scenario,"localStorage.setItem('flux.onboarded','true');location.hash='#/';true")
      // Existing mounted onboarding can redirect once; explicitly leave it by its real control.
      js(scenario,"Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Explorer librement'))?.click();true")
      waitFor(scenario,"document.querySelectorAll('.stream-card').length > 0")
      assertTrue("Page must fit phone",js(scenario,"document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1 && innerWidth <= screen.width + 1")=="true")
      Thread.sleep(2500)
      assertTrue("Floating menu visible in viewport",js(scenario,"(()=>{const r=document.querySelector('.floating-nav').getBoundingClientRect();return r.left>=0 && r.right<=innerWidth && r.bottom<=innerHeight && r.top>0})()")=="true")
      android.util.Log.i("FluxQA",js(scenario,"JSON.stringify({width:innerWidth,height:innerHeight,dpr:devicePixelRatio,nav:document.querySelector('.floating-nav')?.getBoundingClientRect().toJSON(),style:getComputedStyle(document.querySelector('.floating-nav')).display})"))
      screenshot("native-home")
      js(scenario,"document.querySelector('.stream-card').click();true")
      waitFor(scenario,"document.querySelector('video')?.readyState >= 2",100)
      js(scenario,"document.querySelector('video').muted=true;document.querySelector('video').play();true")
      waitFor(scenario,"document.querySelector('video')?.currentTime > 2",40)
      waitFor(scenario,"document.querySelector('.chat-heading')?.textContent.includes('Chat en direct')",40)
      assertTrue("Chat participation is visible",js(scenario,"(()=>{const r=document.querySelector('.chat-login').getBoundingClientRect();return r.top>=0 && r.bottom<=innerHeight+1})()")=="true")
      assertTrue("Player targets are at least 48 CSS pixels",js(scenario,"Array.from(document.querySelectorAll('.player-top-controls button,.player-actions button')).every(b=>{const r=b.getBoundingClientRect();return r.width>=48 && r.height>=48})")=="true")
      screenshot("native-player")
      scenario.onActivity { it.requestedOrientation=ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE }
      waitFor(scenario,"innerWidth > innerHeight")
      Thread.sleep(1200);screenshot("native-landscape")
      scenario.onActivity { it.requestedOrientation=ActivityInfo.SCREEN_ORIENTATION_PORTRAIT }
      waitFor(scenario,"innerWidth < innerHeight")
      js(scenario,"document.querySelector('[aria-label=\"Réduire le lecteur\"]').click();true")
      waitFor(scenario,"!!document.querySelector('.player-shell.mini')")
      js(scenario,"location.hash='#/settings/appearance';true")
      waitFor(scenario,"!!document.querySelector('input[role=switch]')")
      js(scenario,"document.querySelector('input[role=switch]').click();true")
      waitFor(scenario,"document.documentElement.classList.contains('high-contrast')")
      screenshot("native-contrast")
      js(scenario,"document.querySelector('input[role=switch]').click();location.hash='#/';true")
      assertTrue("Native bridge exists",js(scenario,"!!window.__TAURI_INTERNALS__")=="true")
      // Exercise a real short public clip download and play it from the private asset protocol.
      js(scenario,"""
        window.__fluxQa={};
        (async()=>{
          try {
            const invoke=window.__TAURI_INTERNALS__.invoke;
            const top=await invoke('browse',{kind:'streams',variables:{first:5}});
            let clip, login;
            for(const edge of top.streams.edges){
              login=edge.node.broadcaster.login;
              const result=await invoke('browse',{kind:'clips',variables:{login,first:5}});
              clip=result.user.clips.edges.map(e=>e.node).sort((a,b)=>a.durationSeconds-b.durationSeconds)[0];
              if(clip)break;
            }
            if(!clip)throw Error('No public clips to test');
            const result=await invoke('download_start',{kind:'clip',id:clip.slug,title:'FLUX QA clip',channel:login});
            window.__fluxQa.download=result;location.hash='#/downloads';
          }catch(e){window.__fluxQa.error=JSON.stringify(e)}
        })();true
      """.trimIndent())
      waitFor(scenario,"!!window.__fluxQa.download || !!window.__fluxQa.error",100)
      assertTrue("Clip download: "+js(scenario,"window.__fluxQa.error"),js(scenario,"!!window.__fluxQa.download")=="true")
      waitFor(scenario,"!!document.querySelector('[aria-label=\"Lire FLUX QA clip\"]')")
      js(scenario,"document.querySelector('[aria-label=\"Lire FLUX QA clip\"]').click();true")
      waitFor(scenario,"document.querySelector('video')?.readyState >= 2 && document.querySelector('video')?.src.includes('asset')",50)
      screenshot("native-offline-clip")
      js(scenario,"document.querySelector('[aria-label=\"Fermer le lecteur\"]').click();window.__TAURI_INTERNALS__.invoke('download_remove',{id:window.__fluxQa.download.id}).then(()=>window.__fluxQa.removed=true);true")
      waitFor(scenario,"!!window.__fluxQa.removed")
  }
}
