# Specification Assistant

This Repo will be used to develop the Specification Assistant to automatically extract keys out of multiple given specification PDFs of clients that will be used to create a data sheet. 

## Plan

The initial idea is to have a webapp with a simple interface where we could upload the specification pdfs of a project, let the AI do it's job and then present the extracted keys. 

For this we will need to write a service that can extract the text out of pdfs reliably (including tables, images, etc) which could then later be chunked and uploaded to a vector Database, to be able to do RAG on them later (basically have a LLM(Large Language Model) search for the relevant information in the vector Database to extract the information needed for a key). 

After we are satisfied with the performance of extracting text out of the PDFs we will need to :
- decide how to chunk the pdfs (easiest one is per page, more sophisticated approaches like Document or semantic chunking could be tried)
- choose an embedding model/s to create the embeddings out of the created chunks 
- choose a Vector Database to store the chunk embeddings in (Pinecone, Qdrant)
- choose a LLM  orchestration framwork to handle the llm calls (either LLamaIndex or Langchain)
- write a complete end-to-end service as REST APIs that allows: 
    - uploading multiple PDFs
    - chunking the pdfs
    - creating embeddings out of the chunks
    - uploading the chunks to the vector Database
    - calls a LLM-Endpoint which for each needed key performs semantic/hybrid search (RAG) to retrieve relevant chunks out of the PDFs, and either outputs the required key OR states that it could not find relevant information to do that. 
    - returns the keys in JSON which then can be used in the frontend to display the results. 
