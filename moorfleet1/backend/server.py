from flask import Flask
from flask_cors import CORS

from routes.units import units_bp
from routes.alarms import alarms_bp
from routes.kpi import kpi_bp


app = Flask(__name__)
CORS(app)


app.register_blueprint(units_bp, url_prefix='/api/units')
app.register_blueprint(alarms_bp, url_prefix='/api/alarms')
app.register_blueprint(kpi_bp, url_prefix="/api/kpis")  # /api/kpis/U1/1D


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
