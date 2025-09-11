
interface AccountStatusData {
    userName: string;
    status: 'approved' | 'rejected';
    userType: 'seeker' | 'recruiter';
    reason?: string;
}

export const accountStatusTemplate = ({ userName, status, userType, reason }: AccountStatusData): string => {
    const isApproved = status === 'approved';
    const title = isApproved ? `Your ${userType} account has been approved!` : `Update on your ${userType} account`;
    const message = isApproved 
        ? `We are pleased to inform you that your account on HouseOfHire has been approved. You can now log in and start using our platform.`
        : `After careful review, we regret to inform you that your account could not be approved at this time. <br/> <strong>Reason:</strong> ${reason || 'Not specified.'}`;

    return `
    <!DOCTYPE html>
    <html>
    <head>
    <title>Account Status Update</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; background-color: #f4f4f4; }
      .container { max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 30px; border-radius: 8px; background-color: #ffffff; }
      .header { font-size: 24px; font-weight: bold; color: ${isApproved ? '#22c55e' : '#ef4444'}; margin-bottom: 20px; }
      .content { font-size: 16px; line-height: 1.6; }
      .footer { margin-top: 30px; font-size: 12px; color: #888; text-align: center; }
    </style>
    </head>
    <body>
      <div class="container">
        <div class="header">${title}</div>
        <div class="content">
            <p>Dear ${userName},</p>
            <p>${message}</p>
            ${isApproved ? '<p>Welcome aboard!</p>' : '<p>We appreciate your interest and wish you the best in your endeavors.</p>'}
            <p>Best regards,<br/>The HouseOfHire Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 HouseOfHire. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;
};


interface GbsAccountCreationData {
    userName: string;
    userEmail: string;
    password?: string;
}

export const gbsAccountCreationTemplate = ({ userName, userEmail, password }: GbsAccountCreationData): string => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
    <title>Your HouseOfHire Account</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; background-color: #f4f4f4; }
      .container { max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 30px; border-radius: 8px; background-color: #ffffff; }
      .header { font-size: 24px; font-weight: bold; color: #1E3A8A; margin-bottom: 20px; }
      .credentials { background-color: #f0f4ff; border-left: 4px solid #4f46e5; padding: 15px; margin: 20px 0; }
      .footer { margin-top: 30px; font-size: 12px; color: #888; text-align: center; }
    </style>
    </head>
    <body>
      <div class="container">
        <div class="header">An Account Has Been Created For You</div>
        <div class="content">
            <p>Hello ${userName},</p>
            <p>An account has been created for you on the HouseOfHire platform by a GBS administrator. You can now use the following credentials to log in:</p>
            <div class="credentials">
                <p><strong>Email:</strong> ${userEmail}</p>
                <p><strong>Password:</strong> ${password}</p>
            </div>
            <p>We highly recommend changing your password after your first login from your profile page.</p>
            <a href="[Your Login Page URL]" style="display: inline-block; padding: 10px 20px; background-color: #1E3A8A; color: #fff; text-decoration: none; border-radius: 5px;">Login Now</a>
            <p>Best regards,<br/>The HouseOfHire Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 HouseOfHire. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;
};

interface InterviewStatusData {
    candidateName: string;
    jobTitle: string;
    interviewRound: number;
    status: string;
}

export const interviewStatusTemplate = ({ candidateName, jobTitle, interviewRound, status }: InterviewStatusData): string => {
    let message = '';
    switch (status) {
        case 'PROCEED TO ROUND 2':
            message = `Congratulations! Following your recent interview for the ${jobTitle} position, we are pleased to invite you to the next round.`;
            break;
        case 'PROCEED TO SHARE WITH RECRUITER':
            message = `We have completed our initial interview process for the ${jobTitle} position. Your profile will now be shared with the recruiter for their consideration.`;
            break;
        case 'ACCEPTED BY RECRUITER':
             message = `Great news! The recruiter for the ${jobTitle} position has reviewed your profile and wishes to proceed with your application.`;
            break;
        case 'REJECTED':
            message = `Thank you for your time and interest in the ${jobTitle} position. After careful consideration, we have decided not to proceed with your application at this time.`;
            break;
        default:
            message = `There is an update on your application for the ${jobTitle} position. Your status is now: ${status}.`;
    }

    return `
    <!DOCTYPE html>
    <html>
    <head>
    <title>Interview Status Update</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; background-color: #f4f4f4; }
      .container { max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 30px; border-radius: 8px; background-color: #ffffff; }
      .header { font-size: 24px; font-weight: bold; color: #1E3A8A; margin-bottom: 20px; }
      .footer { margin-top: 30px; font-size: 12px; color: #888; text-align: center; }
    </style>
    </head>
    <body>
      <div class="container">
        <div class="header">Update on Your Interview Process</div>
        <div class="content">
            <p>Dear ${candidateName},</p>
            <p>${message}</p>
            <p>We appreciate your continued interest and effort.</p>
            <p>Best regards,<br/>The HouseOfHire Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 HouseOfHire. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;
};
