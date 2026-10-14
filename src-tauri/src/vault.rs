use crate::twitch::{ApiError, Result};
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use rand::{rngs::OsRng, RngCore};
use zeroize::Zeroizing;

pub fn seal(data: &[u8], password: &str) -> Result<Vec<u8>> {
    if password.chars().count() < 10 {
        return Err(ApiError::new(
            "password",
            "Utilisez au moins 10 caractères pour le coffre.",
        ));
    }
    let mut salt = [0u8; 16];
    let mut nonce = [0u8; 12];
    OsRng.fill_bytes(&mut salt);
    OsRng.fill_bytes(&mut nonce);
    let mut key = Zeroizing::new([0u8; 32]);
    argon2::Argon2::default()
        .hash_password_into(password.as_bytes(), &salt, key.as_mut())
        .map_err(|_| ApiError::new("vault", "Création du coffre impossible."))?;
    let cipher = Aes256Gcm::new_from_slice(key.as_ref()).expect("32 byte key");
    let encrypted = cipher
        .encrypt(Nonce::from_slice(&nonce), data)
        .map_err(|_| ApiError::new("vault", "Chiffrement impossible."))?;
    let mut out = b"FLUX1".to_vec();
    out.extend(salt);
    out.extend(nonce);
    out.extend(encrypted);
    Ok(out)
}
pub fn open(data: &[u8], password: &str) -> Result<Zeroizing<Vec<u8>>> {
    let invalid = || ApiError::new("vault", "Mot de passe incorrect ou coffre endommagé.");
    if data.len() < 49 || &data[..5] != b"FLUX1" {
        return Err(invalid());
    }
    let mut key = Zeroizing::new([0u8; 32]);
    argon2::Argon2::default()
        .hash_password_into(password.as_bytes(), &data[5..21], key.as_mut())
        .map_err(|_| invalid())?;
    let cipher = Aes256Gcm::new_from_slice(key.as_ref()).expect("32 byte key");
    cipher
        .decrypt(Nonce::from_slice(&data[21..33]), &data[33..])
        .map(Zeroizing::new)
        .map_err(|_| invalid())
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn vault_authenticates_ciphertext() {
        let blob = seal(b"sensitive token", "long-password").unwrap();
        assert_eq!(&**open(&blob, "long-password").unwrap(), b"sensitive token");
        assert!(open(&blob, "wrong password").is_err());
        let mut changed = blob;
        changed[35] ^= 1;
        assert!(open(&changed, "long-password").is_err());
    }
}
