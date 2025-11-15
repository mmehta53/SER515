from flask import render_template_string
from flask_mail import Mail, Message
from app.models.organization import Organization

mail = Mail()

def send_welcome_email(user_email, first_name, last_name, password, role, org_id):
    """
    Send a welcome email to a newly registered user with their account details.
    
    Args:
        user_email: User's email address
        first_name: User's first name
        last_name: User's last name
        password: Plain text password (not hashed)
        role: User's role (pig, chicken, admin, etc.)
        org_id: Organization ID
    """
    try:
        # Fetch organization name

        organizations = Organization.objects.all()
        organization = None
        for org in organizations:
            if org.id == org_id:
                organization = org
                break
        # org = Organization.objects(id=org_id).first()
        org_name = organization.name if organization else "Your Organization"
        
        # Email subject
        subject = "Welcome to Requirements Engineering Tool(Group 8)- Account Details"
        
        # Email body template
        html_template = """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }
                .container {
                    width: 100%;
                    max-width: 580px;
                    margin: 20px auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                }
                .header {
                    background-color: #4A5568; /* A solid, compatible color */
                    color: white;
                    padding: 10px;
                    text-align: center;
                }
                .header h1 {
                    margin: 0;
                    font-size: 24px;
                }
                .content {
                    padding: 20px 0;
                }
                .greeting {
                    margin-bottom: 20px;
                    font-size: 16px;
                }
                .details-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                .details-table td {
                    padding: 12px;
                    border-bottom: 1px solid #e5e5e5;
                }
                .details-table tr:last-child td {
                    border-bottom: none; /* Remove border from last row */
                }
                .detail-label {
                    font-weight: bold;
                    width: 130px; /* Fixed width for labels */
                    color: #4A5568;
                }
                .detail-value {
                    word-break: break-all;
                }
                .important-note {
                    background-color: #fff3cd;
                    padding: 15px;
                    margin: 20px 0;
                    color: #856404;
                    border-left: 4px solid #ffc107;
                }
                .footer {
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to Requirements Engineering Tool(Group 8)!</h1>
                </div>
                <div class="content">
                    <div class="greeting">
                        <p>Hello <strong>{{ first_name }} {{ last_name }}</strong>,</p>
                        <p>Your account has been successfully created. Below are your login credentials and account details:</p>
                    </div>
                    
                    <table class="details-table" role="presentation" border="0" cellpadding="0" cellspacing="0">
                        <tr>
                            <td class="detail-label">Email:</td>
                            <td class="detail-value">{{ email }}</td>
                        </tr>
                        <tr>
                            <td class="detail-label">Password:</td>
                            <td class="detail-value"><strong>{{ password }}</strong></td>
                        </tr>
                        <tr>
                            <td class="detail-label">First Name:</td>
                            <td class="detail-value">{{ first_name }}</td>
                        </tr>
                        <tr>
                            <td class="detail-label">Last Name:</td>
                            <td class="detail-value">{{ last_name }}</td>
                        </tr>
                        <tr>
                            <td class="detail-label">Role:</td>
                            <td class="detail-value">{{ role }}</td>
                        </tr>
                        <tr>
                            <td class="detail-label">Organization:</td>
                            <td class="detail-value">{{ org_name }}</td>
                        </tr>
                    </table>
                    
                    <div class="important-note">
                        <strong>⚠️ Important:</strong> Please keep your password secure and do not share it with anyone. 
                        If you did not request this account creation, please contact your administrator immediately.
                    </div>
                    
                    <div class="footer">
                        <p>This is an automated email. Please do not reply to this email.</p>
                        <p>&copy; 2025 Requirements Engineering Tool(Group8). All rights reserved.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Render the template with variables
        html_body = render_template_string(
            html_template,
            first_name=first_name,
            last_name=last_name,
            email=user_email,
            password=password,
            role=role.capitalize(),
            org_name=org_name
        )
        
        # Create and send the message
        msg = Message(
            subject=subject,
            recipients=[user_email],
            html=html_body
        )
        
        mail.send(msg)
        print(f"Welcome email sent successfully to {user_email}")
        return True
        
    except Exception as e:
        print(f"Error sending welcome email to {user_email}: {str(e)}")
        return False
