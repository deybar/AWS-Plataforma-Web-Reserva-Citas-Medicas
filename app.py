from flask import Flask, request, jsonify
from flask_cors import CORS
from paciente import guardar_paciente

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return "Backend de Citas Médicas funcionando"

@app.route('/api/guardar_paciente', methods=['POST'])
def api_guardar_paciente():
    data = request.json
    resultado = guardar_paciente(data)
    return jsonify(resultado)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)