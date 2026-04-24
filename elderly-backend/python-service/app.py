# python-service/app.py

from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import numpy as np
import os
from dotenv import load_dotenv
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import re

# Download NLTK data
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('averaged_perceptron_tagger')

load_dotenv()

app = Flask(__name__)
CORS(app)

# Connect to MongoDB
mongo_uri = os.getenv('MONGO_URI', 'mongodb://127.0.0.1:27017/eldercare')
client = MongoClient(mongo_uri)
db = client['eldercare']
users_collection = db['elderlyusers']

# Load pre-trained sentence transformer model for better semantic understanding
# This model understands context better than traditional NLP and Get Help form AI
model = SentenceTransformer('all-MiniLM-L6-v2')

class NLPFriendMatcher:
    def __init__(self):
        self.stop_words = set(stopwords.words('english'))
        self.vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        
    def preprocess_text(self, text):
        """Clean and preprocess text"""
        if not text:
            return ""
        # Convert to lowercase
        text = text.lower()
        # Remove special characters and digits
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        # Tokenize
        tokens = word_tokenize(text)
        # Remove stopwords
        tokens = [t for t in tokens if t not in self.stop_words]
        return ' '.join(tokens)
    
    def extract_keywords(self, hobbies, help_needed):
        """Extract meaningful keywords from user data"""
        keywords = []
        
        # Process hobbies
        if hobbies:
            for hobby in hobbies:
                processed = self.preprocess_text(hobby)
                if processed:
                    keywords.append(processed)
        
        # Process help needed
        if help_needed:
            for help_item in help_needed:
                processed = self.preprocess_text(help_item)
                if processed:
                    keywords.append(processed)
        
        return ' '.join(keywords) if keywords else ""
    
    def create_user_profile(self, user):
        """Create a comprehensive user profile for matching"""
        profile_parts = []
        
        # Add hobbies with weights
        if user.get('hobbies'):
            profile_parts.append(' '.join([f"hobby_{h}" for h in user['hobbies']]))
        
        # Add help needed
        if user.get('helpNeeded'):
            profile_parts.append(' '.join([f"help_{h}" for h in user['helpNeeded']]))
        
        # Add location context
        if user.get('city'):
            profile_parts.append(f"location_{user['city']}")
        if user.get('state'):
            profile_parts.append(f"state_{user['state']}")
        
        # Add mobility information
        if user.get('mobility'):
            profile_parts.append(f"mobility_{user['mobility']}")
        
        return ' '.join(profile_parts)
    
    def calculate_semantic_similarity(self, text1, text2):
        """Calculate semantic similarity using sentence transformers"""
        if not text1 or not text2:
            return 0
        # Encode texts to embeddings
        embedding1 = model.encode([text1])[0]
        embedding2 = model.encode([text2])[0]
        # Calculate cosine similarity
        similarity = np.dot(embedding1, embedding2) / (np.linalg.norm(embedding1) * np.linalg.norm(embedding2))
        return float(similarity)
    
    def calculate_enhanced_match(self, user1, user2):
        """Enhanced matching with NLP and traditional features"""
        scores = []
        weights = {
            'hobbies': 0.35,
            'help_needed': 0.25,
            'semantic': 0.20,
            'location': 0.10,
            'mobility': 0.10
        }
        
        # 1. Hobby matching with semantic understanding
        if user1.get('hobbies') and user2.get('hobbies'):
            hobby_text1 = ' '.join(user1['hobbies'])
            hobby_text2 = ' '.join(user2['hobbies'])
            hobby_similarity = self.calculate_semantic_similarity(hobby_text1, hobby_text2)
            scores.append(weights['hobbies'] * hobby_similarity)
        
        # 2. Help needed matching
        if user1.get('helpNeeded') and user2.get('helpNeeded'):
            help_text1 = ' '.join(user1['helpNeeded'])
            help_text2 = ' '.join(user2['helpNeeded'])
            help_similarity = self.calculate_semantic_similarity(help_text1, help_text2)
            scores.append(weights['help_needed'] * help_similarity)
        
        # 3. Overall semantic profile matching
        profile1 = self.create_user_profile(user1)
        profile2 = self.create_user_profile(user2)
        if profile1 and profile2:
            semantic_score = self.calculate_semantic_similarity(profile1, profile2)
            scores.append(weights['semantic'] * semantic_score)
        
        # 4. Location match
        location_score = 0
        if user1.get('city') and user2.get('city'):
            if user1['city'].lower() == user2['city'].lower():
                location_score = 1
            elif user1.get('state') and user2.get('state') and user1['state'].lower() == user2['state'].lower():
                location_score = 0.5
        scores.append(weights['location'] * location_score)
        
        # 5. Mobility match
        mobility_score = 1 if user1.get('mobility') == user2.get('mobility') else 0
        scores.append(weights['mobility'] * mobility_score)
        
        # Calculate total score (sum of weighted scores)
        total_score = sum(scores) / sum(weights.values())
        
        return round(total_score * 100, 2)
    
    def find_similar_users(self, user_id, limit=10):
        """Find similar users using NLP and ML techniques"""
        # Get current user
        current_user = users_collection.find_one({'_id': ObjectId(user_id)})
        if not current_user:
            return []
        
        # Get all other users
        other_users = list(users_collection.find({
            '_id': {'$ne': ObjectId(user_id)}
        }))
        
        matches = []
        for other_user in other_users:
            match_score = self.calculate_enhanced_match(current_user, other_user)
            
            # Find common interests
            common_hobbies = set(current_user.get('hobbies', [])) & set(other_user.get('hobbies', []))
            common_help = set(current_user.get('helpNeeded', [])) & set(other_user.get('helpNeeded', []))
            
            matches.append({
                'userId': str(other_user['_id']),
                'firstName': other_user.get('firstName', ''),
                'lastName': other_user.get('lastName', ''),
                'profilePhoto': other_user.get('profilePhoto', ''),
                'city': other_user.get('city', ''),
                'state': other_user.get('state', ''),
                'mobility': other_user.get('mobility', ''),
                'hobbies': other_user.get('hobbies', []),
                'helpNeeded': other_user.get('helpNeeded', []),
                'matchPercentage': match_score,
                'commonHobbies': list(common_hobbies),
                'commonHelp': list(common_help),
                'semanticScore': match_score  # Using same score for simplicity
            })
        
        # Sort by match score descending
        matches.sort(key=lambda x: x['matchPercentage'], reverse=True)
        
        return matches[:limit]

from bson import ObjectId

matcher = NLPFriendMatcher()

@app.route('/api/match-users', methods=['POST'])
def match_users():
    """Endpoint to get similar users for a given user"""
    try:
        data = request.json
        user_id = data.get('userId')
        limit = data.get('limit', 10)
        
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400
        
        similar_users = matcher.find_similar_users(user_id, limit)
        
        return jsonify({
            'success': True,
            'users': similar_users
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'NLP Matcher'})

if __name__ == '__main__':
    app.run(port=5001, debug=True)