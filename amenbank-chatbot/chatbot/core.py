import spacy
import numpy as np
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from transformers import pipeline
import json
import os
import sys

@dataclass
class Intent:
    name: str
    patterns: List[str]
    responses: List[str]
    action: Optional[str] = None

class Chatbot:
    def __init__(self):
        try:
            # Load French language model
            self.nlp = spacy.load("fr_core_news_md")
        except OSError:
            print("French language model not found. Installing required model...")
            print("Please run the following command to install the French language model:")
            print("python -m spacy download fr_core_news_md")
            sys.exit(1)
        
        # Initialize sentiment analysis
        self.sentiment_analyzer = pipeline("sentiment-analysis", model="nlptown/bert-base-multilingual-uncased-sentiment")
        
        # Load intents from JSON file
        self.intents = self._load_intents()
        
        # Preprocess patterns for faster matching
        self._preprocess_patterns()

    def _load_intents(self) -> List[Intent]:
        """Load intents from JSON file or use default intents if file doesn't exist."""
        default_intents = [
            Intent(
                name="greeting",
                patterns=[
                    "bonjour", "salut", "bonsoir", "coucou",
                    "comment ça va", "ça va", "comment allez-vous"
                ],
                responses=[
                    "Bonjour ! Comment puis-je vous aider aujourd'hui ?",
                    "Bonjour ! Je suis l'assistant virtuel d'AmenBank. Que puis-je faire pour vous ?"
                ]
            ),
            Intent(
                name="account_creation",
                patterns=[
                    "comment ouvrir un compte", "créer un compte",
                    "ouvrir un compte", "nouveau compte",
                    "démarche pour ouvrir un compte"
                ],
                responses=[
                    "Pour ouvrir un compte chez AmenBank, vous pouvez :\n1. Visiter une de nos agences\n2. Utiliser notre service en ligne\n3. Appeler notre service client\n\nQuelle option préférez-vous ?"
                ],
                action="redirect_to_account_creation"
            ),
            Intent(
                name="credit_info",
                patterns=[
                    "taux d'intérêt", "taux d'interet", "taux de crédit",
                    "conditions de crédit", "simulation de crédit",
                    "demande de crédit", "prêt immobilier", "prêt personnel"
                ],
                responses=[
                    "Je peux vous aider avec les informations sur nos crédits. Nous proposons différents types de prêts :\n- Prêt immobilier\n- Prêt personnel\n- Crédit auto\n\nQuel type de crédit vous intéresse ?"
                ],
                action="redirect_to_credit_simulation"
            ),
            Intent(
                name="help",
                patterns=[
                    "aide", "help", "comment ça marche",
                    "je ne comprends pas", "expliquez-moi"
                ],
                responses=[
                    "Je suis là pour vous aider ! Vous pouvez me poser des questions sur :\n- L'ouverture de compte\n- Les crédits et prêts\n- Les services bancaires\n- Les taux d'intérêt\n\nQue souhaitez-vous savoir ?"
                ]
            ),
            Intent(
                name="goodbye",
                patterns=[
                    "au revoir", "bye", "à bientôt", "merci au revoir",
                    "je m'en vais", "à plus tard"
                ],
                responses=[
                    "Au revoir ! N'hésitez pas à revenir si vous avez d'autres questions.",
                    "À bientôt ! Bonne journée !"
                ]
            )
        ]
        
        try:
            with open('intents.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
                return [Intent(**intent) for intent in data]
        except FileNotFoundError:
            return default_intents

    def _preprocess_patterns(self):
        """Preprocess patterns for faster matching."""
        self.processed_patterns = {}
        for intent in self.intents:
            self.processed_patterns[intent.name] = [
                self.nlp(pattern.lower()) for pattern in intent.patterns
            ]

    def _calculate_similarity(self, text: str, pattern: spacy.tokens.Doc) -> float:
        """Calculate similarity between input text and pattern."""
        text_doc = self.nlp(text.lower())
        return text_doc.similarity(pattern)

    def _detect_intent(self, text: str) -> Tuple[str, float]:
        """Detect the most likely intent for the input text."""
        max_similarity = 0
        best_intent = "unknown"
        
        for intent_name, patterns in self.processed_patterns.items():
            for pattern in patterns:
                similarity = self._calculate_similarity(text, pattern)
                if similarity > max_similarity:
                    max_similarity = similarity
                    best_intent = intent_name
        
        return best_intent, max_similarity

    def _analyze_sentiment(self, text: str) -> str:
        """Analyze the sentiment of the input text."""
        result = self.sentiment_analyzer(text)[0]
        return result['label']

    def process_message(self, text: str, user_context: Optional[Dict] = None) -> Dict:
        """
        Process a user message and return a response.
        
        Args:
            text: The user's message
            user_context: Optional dictionary containing user context (e.g., authentication status)
        
        Returns:
            Dictionary containing:
            - response: The chatbot's response
            - intent: The detected intent
            - action: Any action to take (e.g., redirect)
            - sentiment: The detected sentiment
        """
        # Detect intent
        intent, confidence = self._detect_intent(text)
        
        # Analyze sentiment
        sentiment = self._analyze_sentiment(text)
        
        # Get response
        response = "Je suis désolé, je n'ai pas compris. Souhaitez-vous parler à un conseiller ?"
        action = None
        
        if confidence > 0.5:  # Confidence threshold
            for intent_obj in self.intents:
                if intent_obj.name == intent:
                    response = np.random.choice(intent_obj.responses)
                    action = intent_obj.action
                    break
        
        # Add personalized information if user is authenticated
        if user_context and user_context.get('authenticated'):
            if intent == 'credit_info':
                response += f"\n\nVous avez actuellement {user_context.get('active_credits', 0)} crédit(s) en cours."
        
        return {
            'response': response,
            'intent': intent,
            'confidence': confidence,
            'action': action,
            'sentiment': sentiment
        } 