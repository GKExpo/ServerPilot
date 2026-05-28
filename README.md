<div align="center">
  <img src="assets/icon.ico" width="100" height="100" alt="ServerPilot Logo" />
  <h1>ServerPilot</h1>
  <p><strong>The ultimate desktop control deck for managing local Minecraft servers.</strong></p>
</div>

<br/>

ServerPilot is a beautifully designed, modern Windows desktop application that makes hosting, managing, and playing on local Minecraft servers completely effortless. Forget messy batch files and complicated router configurations. ServerPilot handles everything from server lifecycle to automatic port forwarding via Playit.gg.

---

## ✨ Features

- **🎮 One-Click Start/Stop:** Launch your server and your Playit.gg tunnel simultaneously with a single button.
- **📡 Automatic Multiplayer:** Built-in Playit.gg integration allows friends to join without touching router port forwarding.
- **📊 Live Dashboard:** Monitor Server TPS, CPU utilization, and RAM allocation in real-time.
- **👥 Player Tracking:** See exactly who is online, when they joined, and track their chat/advancement activity.
- **💻 Integrated Console:** A sleek, dark-themed terminal that directly pipes server logs and accepts live commands.
- **📁 File & Properties Manager:** Tweak your `server.properties`, whitelist, and banned players lists without leaving the app.
- **📦 Instant Backups:** Zip up your entire server world with a single click.

---

## 🚀 Getting Started

### Installation
The easiest way to get ServerPilot is to download the compiled `.exe` from the [Releases](https://github.com/GKExpo/ServerPilot/releases) page.

1. Download `ServerPilot-Setup-X.X.X.exe`.
2. Run the installer (No Administrator privileges required).
3. The app will launch the **Onboarding Wizard** automatically to guide you through your first setup.

### Portable Version
If you prefer not to install the app, download `ServerPilot-Portable-X.X.X.exe` and place it anywhere on your system.

---

## 🛡 Security First

ServerPilot V2 was rebuilt from the ground up with a focus on system security and isolation.
- **Full Electron Sandboxing:** The renderer process is strictly sandboxed with no access to Node.js environments.
- **Restricted Filesystem Access:** Built-in safeguards aggressively block the File Manager from modifying Windows system paths or navigating outside your designated server folders.
- **No Admin Required:** The app intentionally runs as `asInvoker`, ensuring maximum safety for your host PC.

---

## 🛠 Tech Stack

- **Framework:** Electron & React 18
- **Styling:** Tailwind CSS & Glassmorphism Aesthetics
- **Build Tool:** Vite
- **Storage:** Electron-Store (Local JSON persistence)
- **Monitoring:** Recharts & Pidusage

---

## 🏗 Build from Source

If you want to contribute or build the application yourself, ensure you have **Node.js 18+** installed.

```bash
# Clone the repository
git clone https://github.com/GKExpo/ServerPilot.git
cd ServerPilot

# Install dependencies
npm install

# Start the development server
npm run dev

# Compile the final Windows Executables (Output is placed in /dist)
npm run dist
```

---

## 🗺 Roadmap

- [ ] Multi-Server parallel execution support
- [ ] Auto-downloader for Paper, Fabric, and Forge JARs
- [ ] Modpack installation manager
- [ ] Mac & Linux support

---

## 📜 Credits
Built by GKExpo. Minecraft is a trademark of Mojang AB. ServerPilot is an unofficial tool and is not affiliated with or endorsed by Mojang or Microsoft.

ServerPilot is a Windows desktop control panel for running local Minecraft servers without opening Command Prompt manually. It manages Paper, Fabric, Forge, and Vanilla server folders with one-click start/stop controls, live console logs, Playit.gg support, backups, file editing, server.properties editing, monitoring, and player activity tracking.

## Download

The easiest way to use ServerPilot is from the GitHub Releases page:

- Download `ServerPilot-Setup-1.0.0.exe` for the normal Windows installer.
- Download `ServerPilot-Portable-1.0.0.exe` if you want to run it without installing.

## What ServerPilot Does

- Add and manage multiple local Minecraft servers.
- Start a server with one click using Java.
- Stop the server safely by sending the Minecraft `stop` command.
- Auto-start and stop Playit.gg with your server.
- Show live console logs and send commands like `op username`, `say hello`, and `stop`.
- Track player joins, leaves, chat, commands, deaths, advancements, and login activity from server logs.
- Browse and edit server files with Monaco Editor.
- Edit `server.properties`, `ops.json`, `whitelist.json`, and `banned-players.json`.
- Create and restore ZIP backups.
- View CPU, RAM, uptime, process ID, Playit status, and player activity.

## Requirements

- Windows 10 or Windows 11
- Java 17 or newer for modern Minecraft servers
- A Minecraft server folder
- A server JAR file such as `paper.jar`
- Optional: Playit.gg for public tunneling

## Step 1: Install Java

Modern Minecraft servers need Java 17 or newer.

Recommended options:

- Eclipse Temurin: https://adoptium.net/
- Oracle Java: https://www.oracle.com/java/technologies/downloads/

After installing Java, open Command Prompt and check:

```bash
java -version
```

If Windows says Java is not recognized, set the Java executable path manually inside ServerPilot. It usually looks like:

```text
C:\Program Files\Eclipse Adoptium\jdk-21...\bin\java.exe
```

## Step 2: Download Paper

Paper is recommended for most servers because it is fast and supports plugins.

1. Go to https://papermc.io/downloads/paper
2. Select your Minecraft version.
3. Download the latest build.
4. Create a folder for your server, for example:

```text
D:\MineCraft\Server
```

5. Put the downloaded Paper JAR inside that folder.
6. Rename it to:

```text
paper.jar
```

Your folder should look like:

```text
D:\MineCraft\Server
  paper.jar
```

## Step 3: First Server Run

Minecraft servers create important files on first run.

To run the server , open command prompt for the folder in which you put the `paper.jar`. And run the following command there.

```text
java -Xmx2G -Xms2G -jar paper.jar nogui
```
This will be only first time setup to create server files in the folder like following `eula.txt` and other.

You can start the server from ServerPilot. If it stops because of the EULA, open this file:

```text
eula.txt
```

Change:

```text
eula=false
```

to:

```text
eula=true
```

Save the file and start the server again.

## Step 4: Download Playit.gg

Playit.gg lets friends join your local server without port forwarding.

1. Go to https://playit.gg/download
2. Download the Windows version.
3. Extract or install it somewhere easy to find, for example:

```text
D:\MineCraft\playit_gg\bin\playit.exe
```

4. Run Playit once and follow the Playit website instructions to claim/configure your tunnel.
5. In ServerPilot, set the Playit executable path to `playit.exe`.
6. Enable `Auto-start Playit`.

When your Minecraft server starts, ServerPilot can start Playit automatically. When the server stops, ServerPilot stops Playit too.

## Step 5: Add a Server in ServerPilot

Click `Add Server` and fill in:

- Server name: any name, for example `My Paper Server`
- Folder path: your server folder, for example `D:\MineCraft\Server`
- Server JAR: `paper.jar`
- Java executable: `java` or the full path to `java.exe`
- Min RAM: `2G`
- Max RAM: `4G`
- JVM arguments: optional
- Playit executable: optional path to `playit.exe`

Recommended JVM arguments:

```text
-XX:+UseG1GC
```

Do not put the full launch command in JVM arguments. ServerPilot already adds Java, RAM, `-jar paper.jar`, and `nogui`.

## Development Setup

Clone the repository:

```bash
git clone https://github.com/GKExpo/ServerPilot.git
cd ServerPilot
```

Install dependencies:

```bash
npm install
```

Run the development app:

```bash
npm run dev
```

Build the renderer:

```bash
npm run build
```

Build the Windows installer and portable EXE:

```bash
npm run dist
```

Build artifacts are written to:

```text
dist/
  ServerPilot-Setup-1.0.0.exe
  ServerPilot-Portable-1.0.0.exe
```

## Player Tracking

ServerPilot tracks players by reading live Minecraft server logs.

It detects:

- Player joined
- Player left
- Chat messages
- Commands used
- Death messages
- Advancements
- Login attempts
- UUID resolution
- Kicks and bans when logged by the server

Some data is shown as `Pending` because vanilla server logs do not expose it directly:

- exact ping
- live coordinates
- inventory
- detailed statistics

Those can be added later with plugin support or by reading the server's player data files.

## Storage

ServerPilot stores app settings in Electron's user data folder. Your Minecraft server files stay in your selected server folder.

Backups are stored inside each server folder:

```text
backups/
```

## Security Notes

- Electron `contextIsolation` is enabled.
- The renderer talks to the main process through a restricted preload IPC bridge.
- Server processes are launched using `child_process.spawn`.
- Server paths are validated before file operations.
- Duplicate server launches are prevented.

## Troubleshooting

### Java is not found

Set the Java executable path manually to your `java.exe`.

### Server crashes with `Could not find or load main class java`

Your JVM arguments probably contain a full Java command. Keep JVM arguments simple, for example:

```text
-XX:+UseG1GC
```

### Player count is not updating

Make sure the server console logs show lines like:

```text
Steve joined the game
Steve left the game
<Steve> hello
```

ServerPilot uses those log lines to update the Players tab.

### Playit does not stop

Use the latest ServerPilot build and make sure Playit was started by ServerPilot, not separately from another terminal.

## License

MIT
