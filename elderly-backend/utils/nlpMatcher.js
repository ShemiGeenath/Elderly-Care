const natural = require('natural');
const compromise = require('compromise');
const { TfIdf } = natural;

class NLPFriendMatcher {
  constructor() {
    this.tfidf = new TfIdf();
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
  }

  preprocessText(text) {
    if (!text) return '';
    // Convert to lowercase
    text = text.toLowerCase();
    // Remove special characters
    text = text.replace(/[^\w\s]/g, '');
    // Tokenize and stem
    const tokens = this.tokenizer.tokenize(text);
    const stemmed = tokens.map(t => this.stemmer.stem(t));
    return stemmed.join(' ');
  }

  calculateSemanticSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    
    // Use compromise for basic NLP
    const doc1 = compromise(text1);
    const doc2 = compromise(text2);
    
    // Extract nouns and verbs for better matching
    const nouns1 = doc1.nouns().out('array');
    const nouns2 = doc2.nouns().out('array');
    const verbs1 = doc1.verbs().out('array');
    const verbs2 = doc2.verbs().out('array');
    
    const allTerms1 = [...nouns1, ...verbs1].map(t => this.stemmer.stem(t.toLowerCase()));
    const allTerms2 = [...nouns2, ...verbs2].map(t => this.stemmer.stem(t.toLowerCase()));
    
    // Calculate Jaccard similarity
    const intersection = allTerms1.filter(t => allTerms2.includes(t)).length;
    const union = new Set([...allTerms1, ...allTerms2]).size;
    
    return union > 0 ? intersection / union : 0;
  }

  calculateEnhancedMatch(user1, user2) {
    const weights = {
      hobbies: 0.35,
      helpNeeded: 0.25,
      semantic: 0.20,
      location: 0.10,
      mobility: 0.10
    };

    let totalScore = 0;
    let totalWeight = 0;

    // Hobby matching with semantic understanding
    if (user1.hobbies?.length && user2.hobbies?.length) {
      const hobbyText1 = this.preprocessText(user1.hobbies.join(' '));
      const hobbyText2 = this.preprocessText(user2.hobbies.join(' '));
      const hobbyScore = this.calculateSemanticSimilarity(hobbyText1, hobbyText2);
      totalScore += weights.hobbies * hobbyScore;
      totalWeight += weights.hobbies;
    }

    // Help needed matching
    if (user1.helpNeeded?.length && user2.helpNeeded?.length) {
      const helpText1 = this.preprocessText(user1.helpNeeded.join(' '));
      const helpText2 = this.preprocessText(user2.helpNeeded.join(' '));
      const helpScore = this.calculateSemanticSimilarity(helpText1, helpText2);
      totalScore += weights.helpNeeded * helpScore;
      totalWeight += weights.helpNeeded;
    }

    // Location matching
    let locationScore = 0;
    if (user1.city && user2.city) {
      if (user1.city.toLowerCase() === user2.city.toLowerCase()) {
        locationScore = 1;
      } else if (user1.state && user2.state && user1.state.toLowerCase() === user2.state.toLowerCase()) {
        locationScore = 0.5;
      }
    }
    totalScore += weights.location * locationScore;
    totalWeight += weights.location;

    // Mobility matching
    const mobilityScore = user1.mobility === user2.mobility ? 1 : 0;
    totalScore += weights.mobility * mobilityScore;
    totalWeight += weights.mobility;

    return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;
  }
}

module.exports = new NLPFriendMatcher();