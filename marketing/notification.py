import os
from twilio.rest import Client
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self):
        # In a real app we load from environment variables
        self.twilio_account_sid = os.environ.get("TWILIO_ACCOUNT_SID", "mock_sid")
        self.twilio_auth_token = os.environ.get("TWILIO_AUTH_TOKEN", "mock_token")
        self.twilio_phone_number = os.environ.get("TWILIO_PHONE_NUMBER", "whatsapp:+14155238886")
        
        # MOCK initialization
        self.is_mock = self.twilio_account_sid == "mock_sid"

    def request_owner_approval(self, festival, combo):
        """
        Mock sending a Firebase Cloud Messaging push notification to the owner's app.
        """
        logger.info(f"[FCM Mock] Sending Push Notification to Store Owner.")
        logger.info(f"-> Title: New Marketing Campaign Suggestion for {festival}")
        logger.info(f"-> Body: Suggested combo: {', '.join(combo['combo'])}. Estimated confidence: {combo['confidence']}")
        return True

    def broadcast_whatsapp_campaign(self, combo, customers=["whatsapp:+919876543210"]):
        """
        Send the marketing message via Twilio WhatsApp API
        """
        message_body = (
            f"🎉 Exclusive Offer! \n"
            f"Get the ultimate Combo: {', '.join(combo['combo'])} at a great price.\n"
            f"Hurry, visit our store to claim!"
        )
        
        if self.is_mock:
            logger.info("[Twilio Mock] Broadcasting WhatsApp Messages...")
            for customer in customers:
                logger.info(f"-> Sending to {customer}:\n{message_body}")
            return True
        else:
            try:
                client = Client(self.twilio_account_sid, self.twilio_auth_token)
                for customer in customers:
                    message = client.messages.create(
                        from_=self.twilio_phone_number,
                        body=message_body,
                        to=customer
                    )
                    logger.info(f"Message sent to {customer}. SID: {message.sid}")
                return True
            except Exception as e:
                logger.error(f"Failed to send Twilio messages: {e}")
                return False

if __name__ == "__main__":
    ns = NotificationService()
    ns.request_owner_approval("Diwali", {"combo": ["Sugar", "Flour", "Oil"], "confidence": 0.8})
    ns.broadcast_whatsapp_campaign({"combo": ["Sugar", "Flour", "Oil"]})
