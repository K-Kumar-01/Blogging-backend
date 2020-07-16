const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.contactForm = (req, res) => {
	const { name, email, message } = req.body;
	const emailData = {
		to: process.env.EMAIL_TO,
		from: email,
		subject: `Contact from - ${process.env.APP_NAME}`,
		text: `Email received from contact from \n Sender name: ${name} \n Sender email: ${email}\n Sender Message: ${message}`,
		html: `<h4>Email recieved from contact form:</h4>
        <p>Sender name : ${name}</p>
        <p>Sender email : ${email}</p>
        <p>Sender message : ${message}</p>
        <hr/>
        <p>This email may contain sensitive information</p>
        <p>https://www.seoblog.com</p>
        `,
	};

	sgMail
		.send(emailData)
		.then((sent) => {
			return res.json({ success: true, message: 'Email sent successfully' });
		})
		.catch((err) => {
			return res.json({ error: 'An unknown error occurred' });
		});
};

exports.contactBlogAuthorForm = (req, res) => {
	const { authorEmail, name, email, message } = req.body;
	// let maillist = [authorEmail, process.env.EMAIL_TO];
	let mailer = process.env.EMAIL_FROM;
	const emailData = {
		to: authorEmail,
		from: mailer,
		subject: `Someone messaged you from ${process.env.APP_NAME}`,
		text: `Email received from contact from \n Sender name: ${name} \n Sender email: ${email}\n Sender Message: ${message}`,
		html: `<h4>Message received from:</h4>
        <p>name : ${name}</p>
        <p>email : ${email}</p>
        <p>इmessage : ${message}</p>
        <hr/>
        <p>This email may contain sensitive information</p>
		<p>https://www.seoblog.com</p>
		<strong>You are receiving this email from mail id other than that of sender. The sender mail address is ${email}</strong>
		<p>You can contacat the sender of the mail at ${email}</p>
        `,
	};

	sgMail
		.send(emailData)
		.then((sent) => {
			return res.json({ success: true, message: 'Email sent successfully' });
		})
		.catch((err) => {
			return res.json({ error: 'An unknown error occurred' });
		});
};
