
interface TemplateData {
    candidateName: string;
    jobTitle: string;
    companyName: string;
    status: string;
    applicationNo: number;
}

export const applicationStatusUpdateTemplate = ({ candidateName, jobTitle, companyName, status, applicationNo }: TemplateData): string => {
    
    const getStatusMessage = () => {
        switch (status.toUpperCase()) {
            case 'IN PROGRESS':
                return `We are pleased to inform you that your application is now in progress. We are currently reviewing your profile and will get back to you soon.`;
            case 'HOLD':
                return `Your application for the ${jobTitle} position is currently on hold. We appreciate your patience and will update you as soon as we have more information.`;
            case 'ACCEPTED':
                return `Congratulations! We are delighted to inform you that your application has been accepted. Expect further communication from us regarding the next steps.`;
            case 'REJECTED':
                return `Thank you for your interest in the ${jobTitle} position. After careful consideration, we have decided to move forward with other candidates. We wish you the best in your job search.`;
            default:
                return `Your application status has been updated to: <strong>${status}</strong>.`;
        }
    };
    
    return `
<!DOCTYPE html>
<html>
<head>
<title>Application Status Update</title>
<style>
  body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; background-color: #f4f4f4; }
  .container { max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 30px; border-radius: 8px; background-color: #ffffff; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
  .header { font-size: 24px; font-weight: bold; color: #1E3A8A; margin-bottom: 20px; text-align: center; }
  .content { font-size: 16px; line-height: 1.6; }
  .status-badge { display: inline-block; padding: 5px 15px; font-size: 14px; font-weight: bold; color: #fff; background-color: #2563EB; border-radius: 15px; margin: 15px 0; }
  .footer { margin-top: 30px; font-size: 12px; color: #888; text-align: center; }
  .details-table { width: 100%; margin: 20px 0; border-collapse: collapse; }
  .details-table td { padding: 8px; border-bottom: 1px solid #eee; }
  .details-table td:first-child { font-weight: bold; color: #555; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">Application Status Update</div>
    <div class="content">
        <p>Dear ${candidateName},</p>
        <p>This is an update regarding your application for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.</p>
        
        <table class="details-table">
            <tr>
                <td>Application ID:</td>
                <td>#${applicationNo}</td>
            </tr>
            <tr>
                <td>New Status:</td>
                <td><span class="status-badge">${status}</span></td>
            </tr>
        </table>
        
        <p>${getStatusMessage()}</p>
        
        <p>Thank you for your interest in our company.</p>
        <p>Best regards,</p>
        <p>The ${companyName} Team</p>
    </div>
    <div class="footer">
      <p>This is an automated notification from HouseOfHire.</p>
      <p>&copy; 2024 HouseOfHire. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
}
