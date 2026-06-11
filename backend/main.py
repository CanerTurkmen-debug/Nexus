import os
import requests
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma

# 1. ANAHTARI BURAYA YAPIŞTIR (Tırnakları unutma)
AKTIF_KEY = "YENI_ANAHTARINIZI_BURAYA_YAZIN" 

def soru_sor(kullanici_sorusu):
    try:
        # 2. EMBEDDING BAĞLANTISI (Arama kısmı)
        embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            google_api_key=AKTIF_KEY
        )
        
        # Veritabanı klasörünü kontrol et
        if not os.path.exists("./hukuk_db"):
            return "Hata: 'hukuk_db' klasörü bulunamadı. Lütfen önce ingest.py çalıştırın."

        vektor_deposu = Chroma(persist_directory="./hukuk_db", embedding_function=embeddings)
        docs = vektor_deposu.similarity_search(kullanici_sorusu, k=3)
        baglam = "\n\n".join([doc.page_content for doc in docs])

        # 3. ÜRETİCİ MODEL (1.5 Flash ile Kota Dostu ve Hızlı)
        # Hata buradaydı: api_key yerine AKTIF_KEY kullanıyoruz
        url = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={AKTIF_KEY}"
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": f"Sen bir Türk hukuk asistanısın. Şu maddeleri kullanarak soruyu yanıtla:\n\n{baglam}\n\nSoru: {kullanici_sorusu}"
                }]
            }],
            "generationConfig": {
                "temperature": 0.3
            }
        }

        response = requests.post(url, json=payload)
        res_json = response.json()

        if response.status_code == 200:
            return res_json['candidates'][0]['content']['parts'][0]['text']
        elif response.status_code == 429:
            return "KOTA HATASI (429): Google şu an yoğun, 10-15 saniye bekleyip tekrar sorunuz."
        else:
            return f"API Cevap Hatası ({response.status_code}): {res_json}"

    except Exception as e:
        return f"Sistem Hatası: {e}"

if __name__ == "__main__":
    print("\n" + "="*40)
    print("--- HUKUK AI: MANUEL KEY MODU AKTİF ---")
    print("="*40)
    while True:
        soru = input("\nSoru (Çıkış: exit): ")
        if soru.lower() == 'exit': break
        print("\n[INFO] Analiz ediliyor...")
        cevap = soru_sor(soru)
        print("-" * 30 + "\nCEVAP:\n" + cevap + "\n" + "-" * 30)