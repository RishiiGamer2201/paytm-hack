# Paytm Hack

This repository contains our project for the hackathon.

## Marketing Feature

The `marketing` folder contains an AI-driven smart marketing application. It is designed to act as a feature of our main project to help business owners run targeted promotional campaigns seamlessly during festivals and specific seasonal events.

### How it works
- **Combo Suggestions:** Uses the Apriori algorithm to analyze historical transaction data and suggest high-conversion item combinations based on past festival or seasonal demand.
- **Sales Forecasting:** Utilizes Prophet time-series modeling to predict the baseline average daily sales for the upcoming week.
- **Owner Dashboard:** A modern, glassmorphism-style UI that allows business owners to natively review data insights (EDA), check confidence metrics, and easily approve combos for campaigns.
- **Backend Infrastructure:** A lightweight FastAPI server running locally that handles ML model inference securely and triggers downstream notifications.

### Setup Instructions
1. Navigate into the `marketing` directory: `cd marketing`
2. Install the necessary dependencies: `pip install -r requirements.txt`
3. Generate the EDA visualization charts: `python eda.py`
4. Start the server: `python -m uvicorn main:app --reload`
5. Open your browser and navigate to `http://127.0.0.1:8000`
