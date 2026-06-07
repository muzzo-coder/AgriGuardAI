import json
import os
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

class RAGEngine:
    def __init__(self, knowledge_path='agricultural_knowledge.json', index_path='faiss_index.bin', model_name='all-MiniLM-L6-v2'):
        self.knowledge_path = knowledge_path
        self.index_path = index_path
        self.model = SentenceTransformer(model_name)
        self.documents = []
        self.index = None
        self.embedding_cache = {} # Simple in-memory cache
        self.load_knowledge()
        self.build_or_load_index()

    def load_knowledge(self):
        if not os.path.exists(self.knowledge_path):
            print(f"WARNING: Knowledge file {self.knowledge_path} not found.")
            return

        with open(self.knowledge_path, 'r') as f:
            data = json.load(f)
        
        self.documents = []
        for item in data:
            # Combine fields into a single searchable string
            fungicides_list = item.get('fungicides', [])
            pesticides_list = item.get('pesticides', [])
            fungicides_str = ", ".join([f"{f.get('name')} ({f.get('active_ingredient')})" for f in fungicides_list]) if fungicides_list else ""
            pesticides_str = ", ".join([f"{p.get('name')} ({p.get('active_ingredient')})" for p in pesticides_list]) if pesticides_list else ""
            
            text = f"Disease: {item.get('disease')}\n" \
                   f"Scientific Name: {item.get('scientific_name', '')}\n" \
                   f"Symptoms: {item.get('symptoms')}\n" \
                   f"Causes: {item.get('causes')}\n" \
                   f"Treatment: {item.get('treatment')}\n" \
                   f"Fungicides: {fungicides_str}\n" \
                   f"Pesticides: {pesticides_str}\n" \
                   f"Prevention: {item.get('prevention')}\n" \
                   f"Recovery Timeline: {item.get('recovery_timeline', '')}\n" \
                   f"Reference Sources: {item.get('reference_sources', '')}\n" \
                   f"Tips: {item.get('additional_tips', '')}"
            self.documents.append({
                "text": text,
                "metadata": item
            })
        print(f"Loaded {len(self.documents)} documents into knowledge base.")

    def build_or_load_index(self):
        if not self.documents:
            return

        # Check if index exists and knowledge hasn't changed (simplified check)
        if os.path.exists(self.index_path):
            try:
                self.index = faiss.read_index(self.index_path)
                print(f"Loaded FAISS index from {self.index_path}")
                return
            except Exception as e:
                print(f"Failed to load index: {e}. Rebuilding...")

        print("Building new FAISS index...")
        texts = [doc['text'] for doc in self.documents]
        embeddings = self.model.encode(texts, show_progress_bar=True)
        
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(np.array(embeddings).astype('float32'))
        
        # Save index
        faiss.write_index(self.index, self.index_path)
        print(f"FAISS index built and saved to {self.index_path}")

    def retrieve_context(self, query, k=2):
        if not self.index or not self.documents:
            return "No local knowledge available."

        # Handle empty or very short queries
        if not query or len(str(query).strip()) < 3:
            return "Query too short for specific knowledge retrieval. Please provide more detail about the symptoms."

        # Handle healthy fallback
        if "healthy" in str(query).lower() and "disease" not in str(query).lower():
            return "Disease: Healthy Plant\nSymptoms: Lush green leaves, strong stems, and steady growth.\nCauses: Balanced nutrients, proper watering, and good environmental conditions.\nTreatment: No treatment required. Continue regular maintenance.\nPrevention: Maintain good hygiene and monitor regularly for early signs of issues.\nTips: Healthy plants are the best defense against diseases and pests."

        # Convert dict to string if necessary to avoid unhashable error
        query_str = str(query) if isinstance(query, dict) else query
        
        # Debugging step as requested
        print(f"Retrieving context for Query: {query_str}")

        # Cache check
        if query_str in self.embedding_cache:
            query_embedding = self.embedding_cache[query_str]
        else:
            query_embedding = self.model.encode([query_str])
            self.embedding_cache[query_str] = query_embedding

        distances, indices = self.index.search(np.array(query_embedding).astype('float32'), k)
        
        results = []
        for i in indices[0]:
            if i != -1 and i < len(self.documents):
                doc = self.documents[i]
                # Ensure we join the text field, not the whole dict
                results.append(doc['text'])
        
        # Proper robust join
        return "\n\n---\n\n".join([str(res) for res in results])

    def retrieve_metadata(self, query, k=1):
        if not self.index or not self.documents:
            return None

        query_str = str(query) if isinstance(query, dict) else query
        query_str = str(query_str).strip()
        if not query_str:
            return None

        # Try exact or normalized disease name matching first
        norm_query = query_str.replace("_", " ").lower()
        if "healthy" in norm_query:
            for doc in self.documents:
                disease_name = doc['metadata'].get('disease', '')
                if "healthy" in disease_name.lower():
                    return doc['metadata']
        for doc in self.documents:
            disease_name = doc['metadata'].get('disease', '')
            if disease_name.replace("_", " ").lower() == norm_query:
                return doc['metadata']

        # Fallback to semantic search
        if query_str in self.embedding_cache:
            query_embedding = self.embedding_cache[query_str]
        else:
            query_embedding = self.model.encode([query_str])
            self.embedding_cache[query_str] = query_embedding

        distances, indices = self.index.search(np.array(query_embedding).astype('float32'), k)
        
        if len(indices) > 0 and indices[0][0] != -1 and indices[0][0] < len(self.documents):
            return self.documents[indices[0][0]]['metadata']
        
        return None

# Initialize a global instance for singleton-like usage in Flask
rag_engine = RAGEngine()

if __name__ == "__main__":
    # Test retrieval
    test_query = "How to treat late blight organically?"
    context = rag_engine.retrieve_context(test_query)
    print(f"Query: {test_query}")
    print(f"Retrieved Context:\n{context}")
