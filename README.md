# Specification Assistant

This Repo will be used to develop the Specification Assistant to automatically extract keys out of multiple given specification PDFs of clients that will be used to create a data sheet.

## Status

The first version of the system is basically complete.

Instead of implementing RAG immediately, we decided to test feeding all specification PDFs directly into the LLM context. Since typical projects have 100-500 pages (average 100-300), modern LLMs can handle this volume without issues.

The backend and UI are functional. What's missing is extensive testing with real specification PDFs and datasheets to validate key extraction performance.

Current challenge: datasheets don't follow conventional column-row structures. Information is spread across documents using colors, formatting, and various layouts. We need to discuss with engineers to get the actual keys we're targeting before we can properly test the system.

## Alternative Approach (if current method doesn't work)

If direct context feeding doesn't yield promising results, we can implement a full RAG pipeline:
- Chunk the PDFs (per page, document-level, or semantic chunking)
- Choose an embedding model to create embeddings from chunks
- Choose a Vector Database (Pinecone, Qdrant)
- Choose an LLM orchestration framework (LlamaIndex or Langchain)
- Implement semantic/hybrid search to retrieve relevant chunks for each key
- Extract keys from retrieved chunks using the LLM 
