# 🤔 Wer ist es? - Multiplayer

Ein browserbasiertes Multiplayer-Ratespiel, das auf dem klassischen "Wer ist es?" (Guess Who?) Spiel basiert. Spieler erstellen oder treten Spielräumen bei und versuchen, den vom Gegner gewählten Charakter durch Ja/Nein-Fragen zu erraten.

## 🎮 Spielprinzip

1. **Raum erstellen oder beitreten**: Ein Spieler erstellt einen Raum mit einem 6-stelligen Code, der andere tritt bei
2. **Charakter wählen**: Beide Spieler wählen geheim einen der 16 verfügbaren Charaktere
3. **Fragen stellen**: Abwechselnd werden Ja/Nein-Fragen über den gegnerischen Charakter gestellt
4. **Eliminieren**: Basierend auf den Antworten werden Charaktere ausgeschlossen
5. **Erraten**: Wer zuerst den richtigen Charakter errät, gewinnt!

## 🚀 Installation & Start

### Voraussetzungen
- Node.js >= 18.0.0
- npm >= 8.0.0

### Lokale Installation
```bash
# Repository klonen
git clone https://github.com/yourusername/wer-ist-es-multiplayer.git
cd wer-ist-es-multiplayer

# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev

# Oder Produktionsserver starten
npm start
```

Der Server läuft standardmäßig auf `http://localhost:3000`

## 🎯 Features

- **Echtzeit-Multiplayer** mit Socket.io
- **Responsive Design** für Desktop und Mobile
- **Automatische Raumverwaltung** mit Timeout-basierter Bereinigung
- **Verbindungsstatus-Anzeige** für bessere User Experience
- **Spielverlauf-Log** zur Nachverfolgung aller Aktionen
- **Character-Elimination** durch Klick-Interface

## 🏗️ Technologie-Stack

- **Backend**: Node.js, Express, Socket.io
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Echtzeit-Kommunikation**: WebSockets
- **Styling**: Custom CSS mit Gradient-Design

## 📊 API Endpoints

- `GET /health` - Server-Gesundheitsstatus
- `GET /stats` - Spielstatistiken (Räume, Spieler, Uptime)

## 🎨 Charaktere

Das Spiel enthält 16 vordefinierte Charaktere mit folgenden Eigenschaften:
- Name, Haarfarbe, Augenfarbe
- Brille (ja/nein), Hut (ja/nein), Bart (ja/nein)
- Geschlecht, Alter

## 🔧 Konfiguration

Umgebungsvariablen:
- `PORT` - Server-Port (Standard: 3000)

## 📱 Deployment

Das Projekt ist für Railway-Deployment optimiert:
- Automatische Port-Erkennung über `process.env.PORT`
- CORS für alle Origins aktiviert
- Speicher-effiziente In-Memory-Verwaltung

## 🤝 Beitragen

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Committe deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

## 📝 Lizenz

Dieses Projekt steht unter der MIT Lizenz - siehe [LICENSE](LICENSE) Datei für Details.

## 🐛 Bug Reports & Feature Requests

Bitte verwende die [GitHub Issues](https://github.com/yourusername/wer-ist-es-multiplayer/issues) für Bug Reports und Feature Requests.