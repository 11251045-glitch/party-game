# 派對之夜 🎉 — 復古夜市電玩多人派對遊戲

一個融合了**復古電玩**與**台灣夜市風情**的多人連線派對 Web App，採用 React 18、Vite、Tailwind CSS、Framer Motion、Web Audio API 等技術打造。
內建 **「你問我答」** 搶答賽與 **「你畫我猜」** 塗鴉賽雙重經典模式！

---

## 🚀 特色功能

1. **實時多人連線同步**：基於 Firebase Realtime Database，玩家分數、搶答器狀態、畫布筆觸及聊天室訊息都是實時同步的。
2. **免金鑰本地聯機測試**：內建自動偵測的 **Firebase 模擬同步技術**（透過 `BroadcastChannel`、`localStorage` 實現），當您使用預設預留的 Firebase Config 時，可**直接在同一個網頁瀏覽器打開多個分頁**進行多人聯機對發測試！
3. **單人模擬測試機器人 🤖**：大廳提供「加測試玩家 🤖」功能！電腦玩家會自動出現在房間裡，在Trivia模式下會隨機搶答，在Drawing模式下會自動畫畫，或在聊天室熱情發言，讓您一個人也能完整測試全部遊戲機制。
4. **Web Audio 合成音效**：內建利用瀏覽器振盪器合成的經典懷舊音效（搶答 Buzz、答對 Chime、十秒倒數 Tick-tock、獲勝 Fanfare）。
5. **響應式座標畫布**：畫布寬高全面採用響應式比例，筆觸座標實時轉化並正規化（0.0 到 1.0 的百分比比例），無論玩家是用 4K 螢幕還是小手機，畫作都是完美等比縮放，絕無越界！

---

## 🛠️ Firebase 專案設定指南

本項目專為下載即用、部署即成設計，填入真正的 Firebase Realtime Database 即可永久使用。

### 步驟 1：建立 Firebase 專案
1. 前往 [Firebase Console](https://console.firebase.google.com/) 並點選 **「新增專案」**。
2. 輸入專案名稱（例如：`party-night`），並啟用/停用 Google Analytics（可任意選擇）。
3. 專案建立完成後，在專案資訊主頁中點選 **「網頁 (Web)」** 圖示來註冊一個網頁應用程式。
4. 拷貝控制台顯示的 `firebaseConfig` 常數內容。

### 步驟 2：啟用實時資料庫 (Realtime Database)
1. 在 Firebase Console 左側導覽列中找到 **建置 (Build)** ➜ **「Realtime Database」**。
2. 點選 **「建立資料庫」**，並選擇最接近的伺服器區域。
3. 預設規則選擇 **以測試模式啟動 (Start in test mode)**，或者啟用以下高安全性規則鎖定：
   ```json
   {
     "rules": {
       "rooms": {
         "$roomCode": {
           ".read": true,
           ".write": true
         }
       }
     }
   }
   ```
4. 複製您的資料庫 URL（類似 `https://your-project-default-rtdb.firebaseio.com/`）。

### 步驟 3：填寫專案 Config
開啟 `/src/firebase.ts` 檔案，在文件頂端將您的 Firebase 配置替換掉預設預留值：
```typescript
// /src/firebase.ts 中的核心部位：
export const firebaseConfig = {
  apiKey: "您的_API_KEY",
  authDomain: "您的_AUTH_DOMAIN",
  databaseURL: "您的_DATABASE_URL",
  projectId: "您的_PROJECT_ID",
  storageBucket: "您的_STORAGE_BUCKET",
  messagingSenderId: "您的_SENDER_ID",
  appId: "您的_APP_ID"
};
```
> **💡 小驚喜**：如果不更換、或使用 `YOUR_API_KEY`，系統會自動在偵測後啟用本地同步模式，依然能開多個分頁完美測試！

---

## 💻 本地開發與構建

1. **安裝依賴**：
   ```bash
   npm install
   ```

2. **啟動本地開發伺服器**：
   ```bash
   npm run dev
   ```

3. **構建生產版本**：
   ```bash
   npm run build
   ```

---

## ☁️ 部署到 Vercel (1 分鐘輕鬆上線)

因為本專案已經完全打包為 SPA 設計，並在根目錄預先引入了 `vercel.json` 轉發規則，您可以直接透過 Vercel CLI 或是串接 GitHub Repo 進行部署：

1. **安裝 Vercel CLI** (選用)：
   ```bash
   npm install -g vercel
   ```
2. **在專案根目錄下指令部署**：
   ```bash
   vercel
   ```
   跟隨终端提示一路確認，部署完成即可獲得公開線上連線網址！
