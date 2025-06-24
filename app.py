from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import os

app = Flask(__name__)
CORS(app)

# 🔐 Telegram konfiguratsiyasi (TOKEN va CHAT_ID'ni siz o'zgartirasiz)
BOT_TOKEN = '7149260069:AAHFj8Ys0VaQUoZd4xlTzf0YiDvNXAF4_28'
CHAT_ID = '5728779626'
LAST_UPDATE_ID = 0

# 📩 Botdan so‘nggi xabarni olish
@app.route('/latest', methods=['GET'])
def get_latest_message():
    global LAST_UPDATE_ID
    try:
        url = f"https://api.telegram.org/bot{BOT_TOKEN}/getUpdates?offset={LAST_UPDATE_ID + 1}"
        res = requests.get(url)
        data = res.json()

        if data['ok'] and len(data['result']) > 0:
            message = None
            for update in data['result']:
                if 'message' in update and 'text' in update['message']:
                    LAST_UPDATE_ID = update['update_id']
                    message = update['message']['text']
            return jsonify(success=True, message=message, update_id=LAST_UPDATE_ID)
        else:
            return jsonify(success=False, message=None)
    except Exception as e:
        print(f"❌ Xatolik: {e}")
        return jsonify(success=False)

# 📤 HTML sahifani Telegramga yuborish
@app.route('/upload-html', methods=['POST'])
def upload_html():
    try:
        data = request.get_json()
        html_content = data.get("html", "")
        if not html_content:
            return jsonify(success=False, error="Bo‘sh HTML yuborildi.")

        file_path = "page.html"
        with open(file_path, "w", encoding='utf-8') as f:
            f.write(html_content)

        with open(file_path, 'rb') as f:
            files = {
                'chat_id': (None, CHAT_ID),
                'document': ('page.html', f, 'text/html')
            }
            res = requests.post(
                f"https://api.telegram.org/bot{BOT_TOKEN}/sendDocument",
                files=files
            )
            return jsonify(success=True, result=res.json())
    except Exception as e:
        print(f"❌ HTML yuborishda xatolik: {e}")
        return jsonify(success=False)

# 🧠 Masofaviy `f1.js` faylni berish
@app.route('/f1.js')
def serve_js():
    return send_from_directory('static', 'f1.js', mimetype='application/javascript')

# 🌐 Bosh sahifa — status tekshirish uchun
@app.route('/')
def home():
    return '✅ Flask server ishlayapti.'

# 🚀 Serverni ishga tushirish (Render yoki lokal uchun)
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)
