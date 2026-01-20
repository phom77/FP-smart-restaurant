const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// GET /api/test-email
router.get('/test-email', async (req, res) => {
    console.log('🔍 Starting SMTP connection test...');
    
    const results = {
        environment: {
            EMAIL_USER: process.env.EMAIL_USER ? '✅ Set' : '❌ Missing',
            EMAIL_PASS: process.env.EMAIL_PASS ? '✅ Set (length: ' + (process.env.EMAIL_PASS?.length || 0) + ')' : '❌ Missing',
            NODE_ENV: process.env.NODE_ENV || 'not set',
            FRONTEND_URL: process.env.FRONTEND_URL || 'not set'
        },
        tests: []
    };

    // Test 1: Port 465 (SSL)
    console.log('\n📧 Test 1: Gmail SMTP Port 465 (SSL)');
    const transporter465 = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        connectionTimeout: 10000,
        debug: true,
        logger: true
    });

    try {
        await transporter465.verify();
        console.log('✅ Port 465 - Connection successful!');
        
        // Thử gửi email test
        const info = await transporter465.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: 'Test Email from Render - Port 465',
            text: 'If you receive this, port 465 works!',
            html: '<b>Port 465 is working!</b>'
        });
        
        results.tests.push({
            test: 'Port 465 (SSL)',
            status: 'success',
            messageId: info.messageId
        });
        console.log('✅ Email sent:', info.messageId);
    } catch (error) {
        console.error('❌ Port 465 failed:', error.message);
        results.tests.push({
            test: 'Port 465 (SSL)',
            status: 'failed',
            error: error.message,
            code: error.code
        });
    }

    // Test 2: Port 587 (TLS)
    console.log('\n📧 Test 2: Gmail SMTP Port 587 (TLS)');
    const transporter587 = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        connectionTimeout: 10000,
        debug: true,
        logger: true
    });

    try {
        await transporter587.verify();
        console.log('✅ Port 587 - Connection successful!');
        
        const info = await transporter587.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: 'Test Email from Render - Port 587',
            text: 'If you receive this, port 587 works!',
            html: '<b>Port 587 is working!</b>'
        });
        
        results.tests.push({
            test: 'Port 587 (TLS)',
            status: 'success',
            messageId: info.messageId
        });
        console.log('✅ Email sent:', info.messageId);
    } catch (error) {
        console.error('❌ Port 587 failed:', error.message);
        results.tests.push({
            test: 'Port 587 (TLS)',
            status: 'failed',
            error: error.message,
            code: error.code
        });
    }

    // Test 3: Service shorthand
    console.log('\n📧 Test 3: Using nodemailer "gmail" service');
    const transporterService = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        connectionTimeout: 10000,
        debug: true,
        logger: true
    });

    try {
        await transporterService.verify();
        console.log('✅ Gmail service - Connection successful!');
        
        const info = await transporterService.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: 'Test Email from Render - Gmail Service',
            text: 'If you receive this, gmail service works!',
            html: '<b>Gmail service is working!</b>'
        });
        
        results.tests.push({
            test: 'Gmail Service',
            status: 'success',
            messageId: info.messageId
        });
        console.log('✅ Email sent:', info.messageId);
    } catch (error) {
        console.error('❌ Gmail service failed:', error.message);
        results.tests.push({
            test: 'Gmail Service',
            status: 'failed',
            error: error.message,
            code: error.code
        });
    }

    // Kết luận
    const allFailed = results.tests.every(t => t.status === 'failed');
    results.conclusion = allFailed 
        ? '❌ ALL TESTS FAILED - SMTP is likely blocked by Render. Switch to Resend/SendGrid!'
        : '✅ At least one method works!';

    console.log('\n' + results.conclusion);
    
    return res.json(results);
});

module.exports = router;