from flask import Flask
from flask_cors import CORS

from routes.units import units_bp
from routes.alarms import alarms_bp
# from routes import kpis_bp


app = Flask(__name__)
CORS(app)


app.register_blueprint(units_bp, url_prefix='/api/units')
app.register_blueprint(alarms_bp, url_prefix='/api/alarms')
# app.register_blueprint(kpis_bp, url_prefix='/api/kpis')


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
