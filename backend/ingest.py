import os
import time
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma

# .env dosyasındaki API anahtarını yükle
load_dotenv()

def verileri_hazirla():
    # 1. PDF Yolu ve Kontrolü
    pdf_yolu = os.path.join("..", "data", "6098-sayılı-borçlar-kanunu.pdf")
    if not os.path.exists(pdf_yolu):
        print(f"Hata: {pdf_yolu} bulunamadı!")
        return

    print("PDF yükleniyor...")
    loader = PyPDFLoader(pdf_yolu)
    sayfalar = loader.load()

    # 2. Metni Parçalara Böl
    # Chunk size'ı biraz daha büyüterek toplam istek sayısını azalttık
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1200, chunk_overlap=150)
    parcalar = text_splitter.split_documents(sayfalar)
    print(f"Toplam {len(parcalar)} parça oluşturuldu.")

    # 3. Embedding Modeli (Senin sisteminde aktif olan tek model)
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")

    print("\nVeritabanı oluşturuluyor... Kotayı aşmamak için yavaş mod aktif.")
    
    # 4. Akıllı Yükleme Döngüsü (Rate Limit Dostu)
    batch_size = 10 # Her seferinde 10 parça göndererek API trafiğini azalttık
    vektor_deposu = None

    for i in range(0, len(parcalar), batch_size):
        batch = parcalar[i:i + batch_size]
        
        while True: # Kota hatası alırsa aynı batch'i tekrar denemek için
            try:
                if i == 0:
                    vektor_deposu = Chroma.from_documents(
                        documents=batch,
                        embedding=embeddings,
                        persist_directory="./hukuk_db"
                    )
                else:
                    vektor_deposu.add_documents(batch)
                
                ilerleme = round((i + len(batch)) / len(parcalar) * 100, 1)
                print(f"İlerleme: %{ilerleme} tamamlandı...")
                
                # Her başarılı işlemden sonra 4 saniye bekle (Güvenli bölge)
                time.sleep(4)
                break # Başarılıysa while döngüsünden çık, sonraki batch'e geç
                
            except Exception as e:
                if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                    print("\n[UYARI] Google Kotası doldu! 35 saniye zorunlu mola veriliyor...")
                    time.sleep(35)
                    print("Yükleme devam ediyor...\n")
                    # Break yapmıyoruz, while True sayesinde aynı batch'i tekrar deneyecek
                else:
                    print(f"\n[HATA] Beklenmedik bir sorun oluştu: {e}")
                    return

    print("\n" + "="*40)
    print("[BAŞARILI] Tüm veriler 'hukuk_db' klasörüne kaydedildi.")
    print("="*40)

if __name__ == "__main__":
    verileri_hazirla()