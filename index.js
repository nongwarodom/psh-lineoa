const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const LINE_CHANNEL_ACCESS_TOKEN = 'phv2ONPwmuGM6U/tOvrPK/qjLB9TiL2S4JcgxsIVcYLa0Iy1cPwqd0gz93WnOv5R7ZgGKgM9jMT0LywQrBTzhqdTHSAt7qXUIhZom5AMfNSUC9HXuSz+C71+Epq3HlHpXEJpo1GLJmoXRPLM5uXcBQdB04t89/1O/w1cDnyilFU=';

// Webhook endpoint
app.post(['/webhook', '/index.js', '/'], async (req, res) => {
    // Return HTTP 200 to LINE
    res.status(200).send('OK');

    const events = req.body.events;
    if (!events || events.length === 0) return;

    for (const event of events) {
        if (event.type === 'message' && event.message.type === 'text') {
            await handleMessage(event);
        }
    }
});

async function handleMessage(event) {
    const userText = event.message.text.trim();
    const replyToken = event.replyToken;
    let replyText = '';

    // ข้อมูลโรคติดต่อ
    const diseaseData = {
        'ไข้เลือดออก': {
            'แหล่งโรคและการติดต่อ': 'ยุงลาย (Aedes aegypti) ที่มีเชื้อไวรัสเดงกี โดยติดเชื้อจากการถูกยุงลายที่มีเชื้อกัด',
            'อาการ': 'ไข้สูงลอย 2-7 วัน, ปวดศีรษะ, ปวดกระบอกตา, ปวดเมื่อยกล้ามเนื้อ, มีจุดเลือดออกตามผิวหนัง',
            'ความเสี่ยง': 'ผู้ที่อาศัยในแหล่งที่มีน้ำขังและยุงชุกชุม (พบบ่อยในหน้าฝน)'
        },
        'มือเท้าปาก': {
            'แหล่งโรคและการติดต่อ': 'ไวรัสเอนเทอโรในลำไส้และสารคัดหลั่งของผู้ป่วย ติดต่อจากการสัมผัสโดยตรงกับน้ำลาย น้ำมูก หรืออุจจาระของผู้ป่วย',
            'อาการ': 'มีไข้, อ่อนเพลีย, มีตุ่มน้ำใสหรือแผลในปาก, ตุ่มแดงหรือตุ่มน้ำใสที่มือและเท้า',
            'ความเสี่ยง': 'เด็กทารกและเด็กเล็กอายุต่ำกว่า 5 ปี (โดยเฉพาะในเนอสเซอรี่หรือโรงเรียนอนุบาล)'
        },
        'ไข้ปวดข้อยุงลาย': {
            'แหล่งโรคและการติดต่อ': 'ยุงลายที่มีเชื้อไวรัสชิคุนกุนยา ติดต่อจากการถูกยุงลายที่มีเชื้อกัด',
            'อาการ': 'มีไข้สูงเฉียบพลัน, มีผื่นแดง, และมีอาการปวดข้ออย่างรุนแรง (อาจปวดเรื้อรังนานหลายเดือน)',
            'ความเสี่ยง': 'ผู้ที่อยู่ในพื้นที่ที่มีการระบาดของยุงลาย'
        },
        'ไข้หวัดใหญ่': {
            'แหล่งโรคและการติดต่อ': 'ติดจากผู้ป่วยที่เป็นไข้หวัดใหญ่ (Influenza) โดยเชื้อจะแพร่ผ่านละอองฝอยจากการไอ จาม หรือสัมผัสสิ่งของที่ปนเปื้อนเชื้อแล้วนำมาสัมผัสตา จมูก ปาก',
            'อาการ': 'ไข้สูง, หนาวสั่น, ปวดเมื่อยกล้ามเนื้อรุนแรง, ไอแห้ง, อ่อนเพลียมาก',
            'ความเสี่ยง': 'เด็กเล็ก, ผู้สูงอายุ, สตรีมีครรภ์, และผู้มีโรคประจำตัว (ควรฉีดวัคซีนทุกปี)'
        },
        'โควิด-19': {
            'แหล่งโรคและการติดต่อ': 'ติดจากผู้ป่วย COVID-19 โดยเชื้อจะแพร่ผ่านละอองฝอยในอากาศจากการไอ จาม พูดคุย หรือสัมผัสพื้นผิวที่ปนเปื้อน',
            'อาการ': 'ไข้, ไอ, อ่อนเพลีย, สูญเสียการรับรส/กลิ่น, หายใจลำบาก (ในรายที่รุนแรง)',
            'ความเสี่ยง': 'ผู้ที่อยู่ในพื้นที่แออัด, ผู้สูงอายุ และผู้มีโรคประจำตัวเรื้อรัง (กลุ่ม 608)'
        },
        'ไข้ดิน': {
            'แหล่งโรคและการติดต่อ': 'เชื้อแบคทีเรีย (Burkholderia) ที่สะสมในดินและแหล่งน้ำธรรมชาติ ติดต่อจากการสัมผัสดิน/น้ำโดยเชื้อเข้าทางแผล หรือการสำลักน้ำที่ปนเปื้อนเข้าสู่ร่างกาย',
            'อาการ': 'อาการหลากหลายตามจุดที่ติดเชื้อ เช่น ติดเชื้อที่ปอดจะมีไข้ ไอเรื้อรัง, ติดเชื้อที่ผิวหนังจะมีแผลเปื่อยเรื้อรัง',
            'ความเสี่ยง': 'เกษตรกร, ผู้ที่ต้องลุยโคลน/ลุยน้ำโดยไม่สวมรองเท้าบูท, และผู้ป่วยโรคเบาหวาน'
        },
        'ฉี่หนู': {
            'แหล่งโรคและการติดต่อ': 'น้ำหรือดินที่ปนเปื้อนปัสสาวะของสัตว์พาหะ (เช่น หนู สุนัข วัว ควาย) ติดต่อโดยเชื้อเข้าสู่ร่างกายผ่านรอยถลอก รอยขีดข่วน หรือเยื่อบุตา/ปาก',
            'อาการ': 'ไข้สูงเฉียบพลัน, ปวดศีรษะ, ปวดกล้ามเนื้อ (โดยเฉพาะน่องและต้นขา), ตาแดง',
            'ความเสี่ยง': 'ผู้ที่เดินลุยน้ำท่วมขัง, ผู้ที่แช่น้ำนานๆ หรือเกษตรกร'
        },
        'หูดับ': {
            'แหล่งโรคและการติดต่อ': 'สุกร (หมู) ที่ป่วยด้วยเชื้อแบคทีเรีย Streptococcus suis ติดต่อจากการกินเนื้อหมู/เลือดหมูดิบ (เช่น หลู้ดิบ) หรือเชื้อเข้าทางบาดแผลจากการชำแหละหมู',
            'อาการ': 'ไข้สูง, ปวดศีรษะรุนแรง, คลื่นไส้อาเจียน, คอแข็ง, และสูญเสียการได้ยิน (หูหนวก/หูดับถาวร)',
            'ความเสี่ยง': 'ผู้ที่รับประทานเนื้อหมูปรุงไม่สุก เลือดหมูดิบ หรือผู้มีอาชีพชำแหละเนื้อหมู'
        }
    };

    // Flow 1: ความรู้โรคติดต่อ (Infectious Disease Knowledge)
    if (userText === 'ความรู้โรคติดต่อ') {
        const quickReplyItems = Object.keys(diseaseData).map(disease => ({
            type: 'action',
            action: { type: 'message', label: disease, text: `ข้อมูลโรค${disease}` }
        }));

        const replyMessage = {
            type: 'text',
            text: 'โปรดเลือกโรคติดต่อที่ต้องการทราบรายละเอียดครับ 👇',
            quickReply: { items: quickReplyItems }
        };
        await sendReply(replyToken, [replyMessage]);
        return; // Return early since we are sending a custom object
    } 
    else if (userText.startsWith('ข้อมูลโรค')) {
        const requestedDisease = userText.replace('ข้อมูลโรค', '');
        const data = diseaseData[requestedDisease];
        
        if (data) {
            replyText = `🦠 **โรค${requestedDisease}**\n\n` +
                        `📍 แหล่งโรคและการติดต่อ:\n${data['แหล่งโรคและการติดต่อ']}\n\n` +
                        `🤒 อาการ:\n${data['อาการ']}\n\n` +
                        `⚠️ ความเสี่ยง:\n${data['ความเสี่ยง']}`;
        }
    }
    // Flow 2: สถานการณ์โรคระบาด (Disease Situation)
    else if (userText === 'สถานการณ์โรคระบาด') {
        replyText = '📊 สถานการณ์โรคติดต่อ อ.ปราสาท (อัปเดตล่าสุด):\n- ไข้เลือดออก: 5 ราย (ต.กังแอน, ต.บ้านพลวง)\n- ไข้ดิน: 2 ราย\nเฝ้าระวังและป้องกันตัวเองด้วยนะครับ';
    }
    // Flow 3: แจ้งเหตุ/รายงานความผิดปกติ (Report Routing)
    else if (userText.startsWith('แจ้งเหตุ') || userText === 'แจ้งเหตุโรคติดต่อ') {
        replyText = '🚨 ได้รับข้อมูลแจ้งเหตุเบื้องต้นแล้วครับ ระบบกำลังส่งข้อมูลไปยังฐานข้อมูลของโรงพยาบาล/สสอ. เพื่อให้เจ้าหน้าที่ตรวจสอบครับ';

        // ตัวอย่างการบันทึกข้อมูลลง Hospital Server
        const reportData = {
            userId: event.source.userId,
            timestamp: new Date().toISOString(),
            message: userText
        };
        await saveToHospitalServer(reportData);
    }

    // หากไม่มีข้อความตอบกลับ (ไม่ตรง Keyword) ให้จบการทำงานโดยไม่ส่งอะไรกลับไป
    if (!replyText) {
        return;
    }

    // Send reply back to LINE
    await sendReply(replyToken, [{ type: 'text', text: replyText }]);
}

// ตัวอย่างฟังก์ชันสำหรับส่งข้อมูลไปยัง Hospital Server
async function saveToHospitalServer(data) {
    try {
        // วิธีที่ 1: ส่งผ่าน REST API ไปยัง Server ของโรงพยาบาล (แนะนำ)
        // const hospitalApiUrl = 'http://your-hospital-server.local/api/reports';
        // await axios.post(hospitalApiUrl, data);

        console.log('✅ [Mock] Data successfully sent to Hospital Server:', data);

        /* 
        // วิธีที่ 2: เชื่อมต่อฐานข้อมูลโดยตรง (เช่น MySQL ที่ใช้ในระบบ HOSxP/JHCIS)
        // ต้องลง package เพิ่ม: npm install mysql2
        const mysql = require('mysql2/promise');
        const connection = await mysql.createConnection({
            host: 'hospital-db-ip',
            user: 'user',
            password: 'password',
            database: 'hospital_db'
        });
        await connection.execute(
            'INSERT INTO disease_reports (user_id, report_text, created_at) VALUES (?, ?, ?)',
            [data.userId, data.message, data.timestamp]
        );
        */
    } catch (error) {
        console.error('❌ Error saving to Hospital Server:', error.message);
    }
}

async function sendReply(replyToken, messages) {
    try {
        await axios.post('https://api.line.me/v2/bot/message/reply', {
            replyToken: replyToken,
            messages: messages
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
            }
        });
    } catch (error) {
        console.error('Error sending reply:', error.response ? error.response.data : error.message);
    }
}

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`LINE OA Webhook server is running on port ${PORT}`);
    });
}

// Export the Express API for Vercel
module.exports = app;
