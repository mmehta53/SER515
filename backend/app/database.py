from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from app.config import Config
import logging

logger = logging.getLogger(__name__)

class MongoDB:
    """MongoDB database connection handler"""
    client = None
    db = None
    collection = None
    
    @classmethod
    def initialize(cls):
        """Initialize MongoDB connection"""
        try:
            cls.client = MongoClient(
                Config.MONGODB_URI,
                serverSelectionTimeoutMS=5000  # 5 second timeout
            )
            # Test the connection
            cls.client.admin.command('ping')
            cls.db = cls.client[Config.MONGODB_DB_NAME]
            cls.collection = cls.db[Config.MONGODB_COLLECTION_NAME]
            logger.info(f"Successfully connected to MongoDB: {Config.MONGODB_DB_NAME}.{Config.MONGODB_COLLECTION_NAME}")
            return True
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            return False
    
    @classmethod
    def close(cls):
        """Close MongoDB connection"""
        if cls.client is not None:
            cls.client.close()
            logger.info("MongoDB connection closed")
    
    @classmethod
    def get_collection(cls):
        """Get the user-stories collection"""
        if cls.collection is None:
            cls.initialize()
        return cls.collection

