const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { execSync } = require('child_process');

const app = express();
const PORT = 25471;
const AVG_PACKET_SIZE = 1024; // realistic average packet size

app.use(cors({
  origin: 'http://47.84.117.249:3001',
  methods: ['GET'],        // allow only GET if thatâ€™s all you need
  credentials: false        // set true if you need cookies/auth headers
}));

// Auto-detect main interface (ignore lo)
let INTERFACE = null;
try {
    const ipOutput = execSync('ip a', { encoding: 'utf8' });
    const lines = ipOutput.split('\n');
    for (let line of lines) {
        const match = line.match(/^\d+:\s+([\w@]+):/);
        if (match) {
            const name = match[1].split('@')[0];
            if (name !== 'lo') {
                INTERFACE = name;
                break;
            }
        }
    }
    console.log('Monitoring interface:', INTERFACE);
} catch (err) {
    console.error('Failed to detect interface:', err);
    INTERFACE = 'eth0';
}

let prevStats = null;
let prevProto = null;
let currentStats = {
    incomingMbps: 0,
    outgoingMbps: 0,
    tcpIncomingMbps: 0,
    tcpOutgoingMbps: 0,
    udpIncomingMbps: 0,
    udpOutgoingMbps: 0
};

// Read /proc/net/dev for bytes and packets
function readNetworkStats() {
    const content = fs.readFileSync('/proc/net/dev', 'utf8');
    const lines = content.split('\n');
    for (let line of lines) {
        line = line.trim();
        if (line.startsWith(INTERFACE + ':')) {
            const data = line.slice(INTERFACE.length + 1).trim().split(/\s+/);
            return {
                bytesIn: parseInt(data[0], 10),
                bytesOut: parseInt(data[8], 10),
                packetsIn: parseInt(data[1], 10),
                packetsOut: parseInt(data[9], 10)
            };
        }
    }
    return null;
}

function readProtocolStats() {
    const snmp = fs.readFileSync('/proc/net/snmp', 'utf8').split('\n');

    let tcpHeader = null, tcpValues = null;
    let udpHeader = null, udpValues = null;

    for (let i = 0; i < snmp.length; i++) {
        const line = snmp[i].trim();
        if (line.startsWith('Tcp:')) {
            tcpHeader = line.split(/\s+/);
            tcpValues = snmp[i + 1]?.trim().split(/\s+/);
        }
        if (line.startsWith('Udp:')) {
            udpHeader = line.split(/\s+/);
            udpValues = snmp[i + 1]?.trim().split(/\s+/);
        }
    }

    if (!tcpHeader || !tcpValues || !udpHeader || !udpValues) return null;

    // dynamically find column positions
    const tcpInIdx = tcpHeader.indexOf('InSegs');
    const tcpOutIdx = tcpHeader.indexOf('OutSegs');
    const udpInIdx = udpHeader.indexOf('InDatagrams');
    const udpOutIdx = udpHeader.indexOf('OutDatagrams');

    return {
        tcpIn: tcpInIdx >= 0 ? parseInt(tcpValues[tcpInIdx], 10) : 0,
        tcpOut: tcpOutIdx >= 0 ? parseInt(tcpValues[tcpOutIdx], 10) : 0,
        udpIn: udpInIdx >= 0 ? parseInt(udpValues[udpInIdx], 10) : 0,
        udpOut: udpOutIdx >= 0 ? parseInt(udpValues[udpOutIdx], 10) : 0
    };
}


// Update stats every second
// Update stats every second
setInterval(() => {
  const stats = readNetworkStats();
  if (!stats) return;

  if (prevStats) {
    const deltaInBytes = stats.bytesIn - prevStats.bytesIn;
    const deltaOutBytes = stats.bytesOut - prevStats.bytesOut;
    const deltaInPackets = stats.packetsIn - prevStats.packetsIn;
    const deltaOutPackets = stats.packetsOut - prevStats.packetsOut;

    // Mbps
    currentStats.incomingMbps = ((deltaInBytes * 8) / 1_000_000).toFixed(3);
    currentStats.outgoingMbps = ((deltaOutBytes * 8) / 1_000_000).toFixed(3);

    // Packets/sec
    currentStats.incomingPackets = deltaInPackets;
    currentStats.outgoingPackets = deltaOutPackets;
  }

  prevStats = stats;
}, 1000);

// Serve stats
app.get('/stats', (req, res) => {
    res.json(currentStats);
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
