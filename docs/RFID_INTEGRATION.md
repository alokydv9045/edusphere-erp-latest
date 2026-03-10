# RFID Attendance Integration Guide

## Overview

EduSphere supports **RFID-based automated attendance tracking** for students, teachers, and staff. This system provides touchless, fast, and accurate attendance marking using RFID cards.

---

## Table of Contents

1. [Hardware Requirements](#hardware-requirements)
2. [RFID Reader Types](#rfid-reader-types)
3. [System Architecture](#system-architecture)
4. [Installation & Setup](#installation--setup)
5. [Card Assignment](#card-assignment)
6. [Attendance Workflow](#attendance-workflow)
7. [API Integration](#api-integration)
8. [Troubleshooting](#troubleshooting)

---

## Hardware Requirements

### RFID Readers

**Supported RFID Standards:**
- Mifare Classic (13.56 MHz)
- Mifare Ultralight
- Mifare DESFire
- ISO14443A/B
- ISO15693

**Recommended Readers:**
1. **USB/Serial Readers**
   - ACR122U USB NFC Reader
   - RC522 RFID Module
   - MFRC522 Reader
   - EM18 RFID Reader

2. **Network-Based Readers**
   - TCP/IP RFID readers
   - WiFi-enabled readers
   - PoE-powered readers

### RFID Cards/Tags

**Supported Formats:**
- ISO cards (CR80 size: 85.60 × 53.98 mm)
- Key fobs
- Wristbands
- Stickers

**Recommended:**
- Mifare Classic 1K cards
- Readable distance: 2-10 cm
- Frequency: 13.56 MHz

### Additional Hardware

- USB cable (for USB readers)
- Ethernet cable (for network readers)
- Power supply (if required)
- Mounting bracket/stand
- Protective casing (for outdoor installations)

---

## RFID Reader Types

### 1. USB/Serial RFID Readers

**Pros:**
- Easy setup
- Lower cost
- Plug-and-play
- No network configuration

**Cons:**
- Requires local computer
- Limited to single location
- USB cable length restrictions

**Connection:**
```bash
# Linux device path
/dev/ttyUSB0
/dev/ttyACM0

# Windows device path
COM3
COM4
```

**Baud Rates:**
- 9600 (most common)
- 115200 (high-speed)

### 2. Network-Based RFID Readers

**Pros:**
- Remote deployment
- Multiple readers support
- Centralized management
- No local computer needed

**Cons:**
- Higher cost
- Network configuration required
- Potential network latency

**Connection:**
- TCP/IP: `192.168.1.100:8080`
- HTTP/REST API
- MQTT protocol
- WebSocket

---

## System Architecture

### Data Flow

```
┌─────────────────┐
│  RFID Card Scan │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  RFID Reader    │ (USB/Network)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Reader Service │ (Node.js)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  School Server  │ (Express API)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PostgreSQL DB  │ (AttendanceRecord)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  WebSocket      │ (Real-time update)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Frontend UI    │ (Attendance dashboard)
└─────────────────┘
```

### Components

1. **RFID Reader Service**: Listens to reader events
2. **REST API**: Processes scanned cards
3. **Database**: Stores attendance records
4. **WebSocket**: Real-time UI updates
5. **Notification Service**: Alerts parents/admins

---

## Installation & Setup

### Step 1: Hardware Setup

#### USB Reader Setup (Linux)

```bash
# 1. Connect USB RFID reader
# 2. Check device
ls -l /dev/ttyUSB*
# or
ls -l /dev/ttyACM*

# 3. Grant permissions
sudo chmod 666 /dev/ttyUSB0

# 4. Add user to dialout group (permanent solution)
sud usermod -a -G dialout $USER

# 5. Log out and log back in for changes to take effect
```

#### USB Reader Setup (Windows)

1. Connect USB RFID reader
2. Install drivers (if required)
3. Check Device Manager for COM port
4. Note the COM port number (e.g., COM3)

#### Network Reader Setup

```bash
# 1. Connect reader to network
# 2. Configure static IP or note DHCP IP
# 3. Test connectivity
ping 192.168.1.100

# 4. Test reader endpoint (if HTTP-based)
curl http://192.168.1.100:8080/api/status
```

### Step 2: Software Installation

#### Install Dependencies

**For USB/Serial Readers:**
```bash
cd erp/server
npm install serialport
npm install node-rfid
```

**For Network Readers:**
```bash
cd erp/server
npm install axios
npm install socket.io-client
```

### Step 3: Configuration

**Environment Variables** (`erp/server/.env`):

```env
# RFID Configuration
RFID_ENABLED=true

# For USB/Serial Readers
RFID_CONNECTION_TYPE=serial
RFID_READER_PORT=/dev/ttyUSB0
RFID_READER_BAUDRATE=9600

# For Network Readers
# RFID_CONNECTION_TYPE=network
# RFID_READER_URL=http://192.168.1.100:8080
# RFID_READER_API_KEY=your-api-key

# Attendance Settings
RFID_AUTO_MARK_ATTENDANCE=true
RFID_DUPLICATE_SCAN_INTERVAL=300  # seconds (prevent duplicate scans within 5 min)

# Notifications
RFID_NOTIFY_PARENTS=true
RFID_NOTIFY_ADMINS=false
```

### Step 4: Create RFID Service

**File:** `erp/server/services/rfidService.js`

```javascript
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

class RFIDService {
  constructor() {
    this.port = null;
    this.parser = null;
  }

  async initialize() {
    const portPath = process.env.RFID_READER_PORT || '/dev/ttyUSB0';
    const baudRate = parseInt(process.env.RFID_READER_BAUDRATE) || 9600;

    try {
      this.port = new SerialPort(portPath, { baudRate });
      this.parser = this.port.pipe(new Readline({ delimiter: '\r\n' }));

      this.parser.on('data', async (cardNumber) => {
        console.log('RFID Card Scanned:', cardNumber);
        await this.handleCardScan(cardNumber.trim());
      });

      this.port.on('error', (err) => {
        console.error('RFID Reader Error:', err.message);
      });

      console.log(`RFID service started on ${portPath}`);
    } catch (error) {
      console.error('Failed to initialize RFID service:', error);
    }
  }

  async handleCardScan(cardNumber) {
    try {
      // Find RFID card in database
      const rfidCard = await prisma.rFIDCard.findUnique({
        where: { cardNumber },
        include: {
          student: { include: { user: true } },
          teacher: { include: { user: true } },
          staff: { include: { user: true } }
        }
      });

      if (!rfidCard || !rfidCard.isActive) {
        console.log('Card not found or inactive:', cardNumber);
        return;
      }

      // Mark attendance
      await this.markAttendance(rfidCard);

      // Emit real-time event
      io.emit('attendance:marked', {
        cardNumber,
        holderType: rfidCard.holderType,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error handling card scan:', error);
    }
  }

  async markAttendance(rfidCard) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Determine attendee type and ID
    let attendeeType = rfidCard.holderType;
    let studentId = rfidCard.studentId;
    let teacherId = rfidCard.teacherId;
    let staffId = rfidCard.staffId;

    // Check for duplicate scan
    const duplicateInterval = parseInt(process.env.RFID_DUPLICATE_SCAN_INTERVAL) || 300;
    const recentScan = await prisma.attendanceRecord.findFirst({
      where: {
        attendeeType,
        studentId,
        teacherId,
        staffId,
        date: today,
        checkInTime: {
          gte: new Date(Date.now() - duplicateInterval * 1000)
        }
      }
    });

    if (recentScan) {
      console.log('Duplicate scan detected, ignoring');
      return;
    }

    // Check if already marked today
    const existingRecord = await prisma.attendanceRecord.findFirst({
      where: {
        attendeeType,
        studentId,
        teacherId,
        staffId,
        date: today
      }
    });

    if (existingRecord) {
      // Update check-out time
      await prisma.attendanceRecord.update({
        where: { id: existingRecord.id },
        data: {
          checkOutTime: new Date()
        }
      });
      console.log('Check-out time updated');
    } else {
      // Create new attendance record
      await prisma.attendanceRecord.create({
        data: {
          attendeeType,
          studentId,
          teacherId,
          staffId,
          date: today,
          checkInTime: new Date(),
          status: 'PRESENT',
          scannedByRFID: true,
          deviceId: process.env.RFID_READER_PORT
        }
      });
      console.log('Attendance marked as PRESENT');

      // Send notification to parents (if student)
      if (studentId && process.env.RFID_NOTIFY_PARENTS === 'true') {
        await sendParentNotification(studentId);
      }
    }
  }

  close() {
    if (this.port) {
      this.port.close();
    }
  }
}

module.exports = new RFIDService();
```

### Step 5: Start RFID Service

**File:** `erp/server/index.js`

```javascript
const express = require('express');
const rfidService = require('./services/rfidService');

const app = express();

// Initialize RFID service if enabled
if (process.env.RFID_ENABLED === 'true') {
  rfidService.initialize();
}

// ... rest of your server code

// Graceful shutdown
process.on('SIGINT', () => {
  rfidService.close();
  process.exit();
});
```

---

## Card Assignment

### Via Web Interface

1. Navigate to **Student Management** or **Teacher Management**
2. Select the individual
3. Click **Assign RFID Card**
4. Scan the RFID card or manually enter card number
5. Save

### Via API

**Endpoint:** `POST /api/rfid/assign`

**Request:**
```json
{
  "cardNumber": "04A1B2C3D4E5F6",
  "holderType": "STUDENT",
  "holderid": "uuid-of-student",
  "expiryDate": "2025-12-31"
}
```

**Response:**
```json
{
  "success": true,
  "message": "RFID card assigned successfully",
  "rfidCard": {
    "id": "uuid",
    "cardNumber": "04A1B2C3D4E5F6",
    "holderType": "STUDENT",
    "isActive": true,
    "issuedDate": "2024-02-12T10:00:00Z"
  }
}
```

### Bulk Card Assignment

**CSV Format:**
```csv
cardNumber,holderType,admissionNumber
04A1B2C3D4E5F6,STUDENT,2024001
05B2C3D4E5F6G7,STUDENT,2024002
06C3D4E5F6G7H8,TEACHER,EMP001
```

**Endpoint:** `POST /api/rfid/bulk-assign`

---

## Attendance Workflow

### Morning Check-In

1. Student/Teacher scans RFID card at entrance
2. System creates attendance record with `checkInTime`
3. Status set to `PRESENT`
4. Real-time notification sent to dashboard
5. Optional: SMS/email notification to parents

### Evening Check-Out

1. Student/Teacher scans RFID card at exit
2. System updates attendance record with `checkOutTime`
3. Total hours calculated
4. Optional: Exit notification to parents

### Late Arrival

```javascript
// Automatic late detection
const schoolStartTime = '08:30';
const checkInTime = new Date('2024-02-12T09:15:00');

const [hours, minutes] = schoolStartTime.split(':');
const startTime = new Date();
startTime.setHours(hours, minutes, 0);

const status = checkInTime > startTime ? 'LATE' : 'PRESENT';
```

---

## API Integration

### Endpoints

#### 1. Mark Attendance (Manual)
```
POST /api/attendance/mark
```

**Request:**
```json
{
  "studentId": "uuid",
  "date": "2024-02-12",
  "status": "PRESENT",
  "remarks": "Manual entry"
}
```

#### 2. Get Attendance Report
```
GET /api/attendance/report?studentId=uuid&startDate=2024-02-01&endDate=2024-02-29
```

**Response:**
```json
{
  "student": {
    "id": "uuid",
    "name": "John Doe",
    "admissionNumber": "2024001"
  },
  "period": {
    "startDate": "2024-02-01",
    "endDate": "2024-02-29",
    "totalDays": 20,
    "presentDays": 18,
    "absentDays": 2,
    "percentage": 90
  },
  "records": [...]
}
```

#### 3. Get Today's Attendance
```
GET /api/attendance/today
```

#### 4. RFID Card Status
```
GET /api/rfid/status/:cardNumber
```

---

## Real-Time Updates (WebSocket)

### Server-Side (Socket.io)

```javascript
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('subscribe:attendance', (classId) => {
    socket.join(`attendance:${classId}`);
  });
});

// Emit attendance event
io.to(`attendance:${classId}`).emit('attendance:update', {
  student: studentData,
  status: 'PRESENT',
  timestamp: new Date()
});
```

### Client-Side (React)

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5001');

socket.on('connect', () => {
  socket.emit('subscribe:attendance', classId);
});

socket.on('attendance:update', (data) => {
  console.log('New attendance:', data);
  // Update UI
});
```

---

## Troubleshooting

### Reader Not Detected

**Issue:** RFID reader not showing in device list

**Solution:**
```bash
# Linux: Check USB devices
lsusb

# Check serial ports
ls -l /dev/tty*

# Install drivers if needed
sudo apt-get install libusb-dev

# Windows: Check Device Manager
# Install manufacturer drivers
```

### Card Not Reading

**Issue:** Card scan not detected

**Checklist:**
- [ ] Card is compatible (13.56 MHz)
- [ ] Card is within range (2-10 cm)
- [ ] Reader has power/connection
- [ ] Baud rate is correct
- [ ] No interference from metal objects

**Test:**
```bash
# Read directly from serial port
cat /dev/ttyUSB0
# Scan a card - you should see output
```

### Duplicate Scans

**Issue:** Same card scanned multiple times

**Solution:**
- Enable `RFID_DUPLICATE_SCAN_INTERVAL`
- Add debouncing logic
- Check reader sensitivity

### Permission Denied

**Issue:** Cannot access `/dev/ttyUSB0`

**Solution:**
```bash
# Temporary fix
sudo chmod 666 /dev/ttyUSB0

# Permanent fix
sudo usermod -a -G dialout $USER
# Log out and log back in
```

### Network Reader Connection Failed

**Issue:** Cannot connect to network reader

**Checklist:**
- [ ] Reader is powered on
- [ ] IP address is correct
- [ ] Network is reachable (ping test)
- [ ] Firewall allows connection
- [ ] API endpoint is correct

---

## Best Practices

### Security

1. **Encrypt card data** in database
2. **Use HTTPS** for network readers
3. **Implement rate limiting** to prevent spam
4. **Log all scans** for audit trail
5. **Validate card authenticity**

### Performance

1. **Use connection pooling** for database
2. **Batch process** notifications
3. **Cache frequently accessed data**
4. **Use indexes** on cardNumber field
5. **Implement retry logic** for failed scans

### Deployment

1. **Test with sample cards** before production
2. **Train staff** on card assignment
3. **Monitor reader health** (uptime, error rate)
4. **Have backup readers** ready
5. **Regular maintenance** of readers

### User Experience

1. **Provide visual feedback** (LED/beep on reader)
2. **Show real-time updates** on dashboard
3. **Notify parents** immediately
4. **Handle edge cases** (late arrival, early leave)
5. **Generate attendance reports** automatically

---

## Hardware Vendors

### Recommended Suppliers

1. **ACR122U Reader**: https://www.acs.com.hk/
2. **RFID Cards**: Local suppliers or Alibaba
3. **Network Readers**: HID Global, Honeywell

### Cost Estimates (India)

- USB RFID Reader: ₹1,500 - ₹3,000
- Network RFID Reader: ₹5,000 - ₹15,000
- Mifare 1K Cards (100 pcs): ₹2,000 - ₹3,500
- Installation: ₹5,000 - ₹10,000 per location

---

## Support

For RFID integration support:
- Email: support@edusphere.com
- Documentation: https://docs.edusphere.com/rfid
- Community: https://community.edusphere.com

---

## Appendix

### RFID Card UID Formats

- **Mifare Classic**: 4-byte (8 hex digits)
  - Example: `04A1B2C3`
- **Mifare Ultralight**: 7-byte (14 hex digits)
  - Example: `04A1B2C3D4E5F6`

### Supported Baud Rates

- 2400
- 4800
- 9600 (recommended)
- 19200
- 38400
- 57600
- 115200

### Testing Card UIDs

**Online Tool**: https://www.rfidshop.com/card-uid-reader

**Test Command** (Linux with ACR122U):
```bash
sudo apt-get install libnfc-bin
nfc-list
# Scan a card to see UID
```

---

## Future Enhancements

1. **Face Recognition**: Combine with facial recognition
2. **Mobile App**: RFID scanning via NFC-enabled phones
3. **Geo-Fencing**: Ensure scans are within school premises
4. **Biometric Backup**: Fingerprint as fallback
5. **AI Analytics**: Predict attendance patterns
