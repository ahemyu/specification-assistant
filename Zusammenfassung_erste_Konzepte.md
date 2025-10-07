# PDF Datenextraktionssystem - Zusammenfassung

## Zwei Hauptansätze



### Option 1: Direkte LLM-Extraktion

* Extrahiere gesamten Text (inklusive Tabellen in Markdown) aus PDFs
* Füttere alles direkt ins LLM, um benötigte Felder zu extrahieren
* Problem: PDFs sind jeweils 100+ Seiten, macht das wahrscheinlich nicht machbar
* Lohnt sich trotzdem zum initialen Testen, um LLM-Performance zu benchmarken



### Option 2: Vector DB + RAG

* PDFs in Vektordatenbank embedden (eine Collection pro Projekt)
* LLM fragt Embeddings ab, um Felder zu finden und zu extrahieren
* Zentrale Fragen:

  * Kann das LLM ~30 Felder in einem Call extrahieren, oder brauchen wir sequentielle Calls? (Sequentiell wird langsam sein, könnte aber akzeptabel sein)
  * Chunking-Strategie nötig - am einfachsten wäre Seite-für-Seite, aber semantisches Chunking (Kamradt-Methode) oder dokumentspezifische Ansätze wären auch möglich
  * Muss tracken, aus welchem PDF/welcher Seite jeder Chunk kommt (in Metadaten)
  * Tabellen brauchen möglicherweise spezielle Extraktion und Zusammenfassung für effektives Chunking
  * Speed-Requirements unklar - ist 1 Stunde pro Datenblatt akzeptabel?

* Sollten Hybrid-Search vs. rein semantische vs. Keyword-Search testen



So oder so ist der erste step für dieses Projekt zuverlässig den Text/Tabellen aus den Pdfs auslesen zu können. 
Somit wäre mein Vorschlag mit der Entwicklung und Testen des Auslesens zu beginnen. 



## Tech Stack Vorschlag



### Infrastruktur:

* Azure Web Apps für Hosting
* Azure File Storage für PDFs (falls nötig)
* Azure AI Foundry für LLM-Calls (brauchen API-Zugang, oder Gemini Free Tier für PoC nutzen)



### Vector DB:

* Pinecone (Closed Source, braucht Lizenz) oder Qdrant (Open Source, Deutschland-basiert)



### Backend:

* FastAPI (Python) mit REST-Endpoints wie `/create-datasheet`, `/chat`
* Brauchen Evaluierungssystem mit Confidence Scores für extrahierte Felder (falls technisch machbar)
* Muss klar kennzeichnen, wenn Felder nicht zuverlässig extrahiert werden konnten



### Frontend:

* TypeScript + Svelte (oder React/vanilla JS)
* Initiale Features: PDF-Upload-Button, Datenblatt-Preview/Download, Übersicht extrahierter Felder mit Quellenangaben (PDF + Seitennummer)
* 

## Testdaten-Beobachtungen

* PDFs enthalten viele Tabellen (meist einfach, keine merged cells) - sollten zu Markdown konvertiert werden
* Beispiel-Datenblätter sind keine simplen Zeilen/Spalten-Strukturen - nicht direkt generierbar
* Task ist: Benötigte Felder aus PDFs extrahieren, um Datenblatt zu befüllen (initiales Befüllen manuell)
* Kritisch: Immer Quell-PDF und Seitennummer in Chunk-Metadaten inkludieren, unabhängig von der Chunking-Methode
