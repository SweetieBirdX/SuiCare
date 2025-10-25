# 🚀 SuiCare Testnet Deployment Instructions

## ✅ Deployment Script Hazır!

**Status:** `scripts/deploy-testnet.ts` tüm Sui SDK güncellemeleri ile uyumlu hale getirildi.

---

## 📦 Ön Gereksinimler

### 1. Yazılım Gereksinimleri
```bash
# Node.js v18+ yüklü olmalı
node --version

# Sui CLI yüklü olmalı
sui --version

# Walrus CLI (opsiyonel, storage için)
walrus --version
```

### 2. Wallet Kurulumu

#### Otomatik Kurulum (Önerilen):
```bash
chmod +x scripts/setup-wallet.sh
./scripts/setup-wallet.sh
```

#### Manuel Kurulum:
```bash
# Yeni adres oluştur
sui client new-address ed25519

# Testnet'e geç
sui client switch --env testnet

# Private key'i export et
sui keytool export --key-identity $(sui client active-address) --json false
```

### 3. Token Alma

#### SUI Token (Gas için):
```bash
# Method 1: CLI
sui client faucet

# Method 2: Discord (En güvenilir)
# 1. Discord'a katıl: https://discord.gg/sui
# 2. #testnet-faucet kanalına git
# 3. Komut: !faucet YOUR_SUI_ADDRESS
```

#### WAL Token (Walrus storage için - opsiyonel):
```bash
# Walrus CLI ile
walrus get-wal --network testnet
```

---

## ⚙️ Konfigürasyon

### 1. Environment Dosyası Oluştur
```bash
cp .env.example .env.testnet
```

### 2. `.env.testnet` Dosyasını Düzenle

**Minimum Gerekli Değerler:**
```env
# Wallet (setup-wallet.sh'dan alınacak)
DEPLOYER_PRIVATE_KEY=suiprivkey1q...
DEPLOYER_SUI_ADDRESS=0xabcd...

# Enoki API Key (https://enoki.mystenlabs.com/'dan alınacak)
ENOKI_API_KEY=enoki_...

# Seal Key Servers (opsiyonel, development için boş bırakılabilir)
SEAL_KEY_SERVERS=
```

**Not:** Walrus konfigürasyonu `.env.testnet` dosyasında önceden doldurulmuştur:
```env
WALRUS_SYSTEM_OBJECT=0x6c2547cbbc38025cf3adac45f63cb0a8d12ecf777cdc75a4971612bf97fdf6af
WALRUS_STAKING_OBJECT=0xbe46180321c30aab2f8b3501e24048377287fa708018a5b7c2792b35fe339ee3
```

---

## 🚀 Deployment

### Tek Komutla Deployment:
```bash
npm run deploy:testnet
```

### Deployment İşlem Adımları:

Script otomatik olarak şunları yapar:

1. ✅ **Environment Validation** - Tüm gerekli değişkenleri kontrol eder
2. ✅ **Balance Check** - SUI ve WAL bakiyelerini kontrol eder
3. ✅ **Move Compilation** - Smart contract'ları derler
4. ✅ **Package Deployment** - Move paketini Testnet'e deploy eder
5. ✅ **System Initialization** - MasterKey ve HealthRegistry oluşturur
6. ✅ **Example Objects** - Örnek DoctorCapability ve PatientRecord oluşturur
7. ✅ **Integration Tests** - (Opsiyonel) Seal & Walrus testleri
8. ✅ **Report Generation** - Deployment raporunu oluşturur

### Beklenen Çıktı:

```
╔════════════════════════════════════════════════════════════╗
║           🏥 SuiCare Testnet Deployment Script 🏥          ║
╚════════════════════════════════════════════════════════════╝

STEP 1/8: Validating Environment Configuration
  ✅ All required environment variables are set

STEP 2/8: Checking Wallet Balances
  ✅ SUI: 10.0000 SUI
  ✅ WAL: 5.0000 WAL (or skipped)

STEP 3/8: Compiling Move Package
  ✅ Move package compiled successfully

STEP 4/8: Deploying Move Package to Testnet
  ✅ Package deployed successfully!
  ✅ Package ID: 0xABCD1234...
  ✅ Transaction digest: ABC123...

STEP 5/8: Initializing System Objects
  ✅ Found MasterKey: 0xDEF456...

STEP 6/8: Creating Example Capabilities & Records
  ✅ DoctorCapability created: 0x789ABC...
  ✅ PatientRecord created: 0x123DEF...

STEP 7/8: Testing Seal & Walrus Integrations
  ✅ Integration tests skipped (run separately)

STEP 8/8: Generating Deployment Report
  ✅ Deployment report saved to DEPLOYMENT_REPORT.md

════════════════════════════════════════════════════════════
✅ DEPLOYMENT COMPLETE!
════════════════════════════════════════════════════════════
```

---

## 📊 Deployment Sonrası

### 1. Deployment Raporunu İncele
```bash
cat DEPLOYMENT_REPORT.md
```

### 2. Sui Explorer'da Kontrol Et
```
https://suiexplorer.com/object/<PACKAGE_ID>?network=testnet
```

### 3. Deployed Object'leri Görüntüle
```bash
# Tüm objelerinizi listeleyin
sui client objects

# Belirli bir objeyi inceleyin
sui client object <OBJECT_ID>
```

### 4. `.env.testnet` Güncellemelerini Kontrol Et

Deployment script otomatik olarak şunları günceller:
- `PACKAGE_ID` - Deploy edilen Move paketinin ID'si
- `MASTER_KEY_ID` - MasterKey objesinin ID'si
- `DOCTOR_CAPABILITY_ID` - Örnek doctor capability ID'si
- `PATIENT_RECORD_ID` - Örnek patient record ID'si

---

## 🧪 Entegrasyon Testi

### Seal + Walrus Entegrasyonunu Test Et:
```bash
npm run integration-demo
```

**Beklenen Çıktı:**
```
════════════════════════════════════════════════════════════
  Seal + Walrus Integration Demo
════════════════════════════════════════════════════════════

1. Encrypting Patient Data (Seal)
   ✓ Data encrypted successfully

2. Uploading to Walrus
   ✓ Data stored in Walrus. Blob ID: 0xABC123...

3. Retrieving & Decrypting Data
   ✓ Data decrypted successfully

════════════════════════════════════════════════════════════
  INTEGRATION DEMO COMPLETE!
════════════════════════════════════════════════════════════
```

---

## 🔧 Move Contract İşlemleri

### Manuel Move Fonksiyon Testleri:

#### 1. Patient Record Oluştur
```bash
sui client call \
  --package <PACKAGE_ID> \
  --module health_record \
  --function create_patient_record \
  --args "policy-id-placeholder" 0x6 \
  --gas-budget 10000000
```

#### 2. Doctor Capability Oluştur
```bash
sui client call \
  --package <PACKAGE_ID> \
  --module health_record \
  --function create_doctor_capability \
  --args "Dr. John Doe" "License #12345" \
  --gas-budget 10000000
```

#### 3. Erişim İsteği (Doctor)
```bash
sui client call \
  --package <PACKAGE_ID> \
  --module health_record \
  --function request_access \
  --args <PATIENT_RECORD_ID> <DOCTOR_ADDRESS> \
  --gas-budget 10000000
```

#### 4. Erişim Onayı (Patient)
```bash
sui client call \
  --package <PACKAGE_ID> \
  --module health_record \
  --function grant_access \
  --args <PATIENT_RECORD_ID> <DOCTOR_ADDRESS> \
  --gas-budget 10000000
```

#### 5. Event'leri Sorgula (Audit Trail)
```bash
sui client events --package <PACKAGE_ID>
```

---

## 🆘 Troubleshooting

### "Insufficient gas" Hatası
```bash
# Discord faucet'ten daha fazla SUI alın (en güvenilir)
# Discord: https://discord.gg/sui
# Kanal: #testnet-faucet
# Komut: !faucet YOUR_ADDRESS
```

### "Move compilation failed" Hatası
```bash
# Build klasörünü temizle ve tekrar derle
cd health_record_project
rm -rf build
sui move build
```

### "Walrus upload failed" Hatası
```bash
# WAL token'ı alın
walrus get-wal --network testnet

# Bakiyeyi kontrol edin
sui client gas
```

### "Seal encryption failed" Hatası
```bash
# Development için Seal key server'ları opsiyoneldir
# .env.testnet dosyasında SEAL_KEY_SERVERS boş bırakılabilir
# Seal production entegrasyonu için:
# https://docs.mystenlabs.com/seal adresinden erişim isteyin
```

---

## 📚 Ek Kaynaklar

### Resmi Dokümantasyon
- **Sui Docs:** https://docs.sui.io
- **Seal Docs:** https://docs.mystenlabs.com/seal
- **Walrus Docs:** https://docs.walrus.site
- **Enoki Docs:** https://docs.mystenlabs.com/enoki

### Proje Dokümantasyonu
- **Quick Start:** [QUICK_START.md](./QUICK_START.md)
- **Full Deployment Guide:** [TESTNET_DEPLOYMENT_GUIDE.md](./TESTNET_DEPLOYMENT_GUIDE.md)
- **Deployment Checklist:** [TESTNET_DEPLOYMENT_CHECKLIST.md](./TESTNET_DEPLOYMENT_CHECKLIST.md)
- **Deployment Complete Summary:** [TESTNET_DEPLOYMENT_COMPLETE.md](./TESTNET_DEPLOYMENT_COMPLETE.md)

### Community
- **Sui Discord:** https://discord.gg/sui
- **Sui Forum:** https://forums.sui.io

---

## ✅ Başarı Kriterleri

Deployment başarılı sayılır eğer:

1. ✅ Move paketi Testnet'e deploy edildi (`PACKAGE_ID` alındı)
2. ✅ `MasterKey` objesi oluşturuldu
3. ✅ Örnek `DoctorCapability` ve `PatientRecord` objeleri oluşturuldu
4. ✅ Tüm object ID'leri `.env.testnet` dosyasına kaydedildi
5. ✅ `DEPLOYMENT_REPORT.md` dosyası oluşturuldu
6. ✅ Sui Explorer'da paket görüntülenebiliyor
7. ✅ Move fonksiyonları CLI ile çağrılabiliyor
8. ✅ Event'ler (audit trail) sorgulanabiliyor

---

## 🎯 Sonraki Adımlar

### Kısa Vadeli
1. ✅ Deployment tamamlandı
2. ⏳ Seal key server erişimi (production için)
3. ⏳ Frontend UI düzeltmeleri (React JSX hataları)
4. ⏳ Wallet integration testleri

### Orta Vadeli
- [ ] React UI'ın çalışır hale getirilmesi
- [ ] ZK Login entegrasyonunun testi
- [ ] Role-based dashboard'ların test edilmesi
- [ ] Audit log UI'ın geliştirilmesi

### Uzun Vadeli
- [ ] Mainnet deployment planlaması
- [ ] Security audit
- [ ] Load testing
- [ ] Production monitoring

---

## 🎉 Tebrikler!

SuiCare sisteminiz artık Sui Testnet'te çalışıyor! 

**Deployed Components:**
- ✅ Move Smart Contracts (420+ lines)
- ✅ Seal Integration (encryption)
- ✅ Walrus Integration (storage)
- ✅ RBAC System (roles & permissions)
- ✅ Emergency Access (MasterKey)
- ✅ Audit Trail (on-chain events)

**Next:** Test your deployment with `npm run integration-demo`

---

**Deployment Script Version:** 1.0  
**Last Updated:** October 2025  
**Status:** ✅ READY FOR TESTNET DEPLOYMENT

