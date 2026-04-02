import pandas as pd
from mlxtend.frequent_patterns import apriori, association_rules
from prophet import Prophet
import os
import warnings

warnings.filterwarnings('ignore')

class MLPipeline:
    def __init__(self, data_path="munimai_dataset_5000.csv"):
        self.data_path = data_path
        self.df = None
        self._load_data()

    def _load_data(self):
        if os.path.exists(self.data_path):
            self.df = pd.read_csv(self.data_path)
            if 'Date' in self.df.columns:
                self.df['Date'] = pd.to_datetime(self.df['Date'])
        else:
            raise FileNotFoundError(f"Dataset {self.data_path} not found.")

    def get_combo_suggestions(self, festival=None, season=None):
        """
        Uses Apriori to generate combo suggestions based on Festival or Season
        """
        data = self.df.copy()
        
        if festival and festival != 'None':
            data = data[data['Festival/Event'] == festival]
        if season:
            data = data[data['Season'] == season]
            
        if len(data) == 0:
            return []

        # Parse Top Purchased Items into a one-hot encoded dataframe
        # Top Purchased Items looks like "Vegetables, Bread, Eggs"
        item_lists = data['Top Purchased Items'].dropna().apply(lambda x: [item.strip() for item in str(x).split(',')])
        
        # Determine all unique items
        all_items = set(x for l in item_lists for x in l)
        
        # One-hot encode
        encoded_data = []
        for l in item_lists:
            encoded_data.append({item: (1 if item in l else 0) for item in all_items})
            
        ohe_df = pd.DataFrame(encoded_data).fillna(0).astype(bool)
        
        if len(ohe_df) < 5:
            # Not enough data for Apriori, return basic frequency
            return [{"combo": list(all_items)[:3], "confidence": "High", "support": 1.0}]

        # Apply Apriori
        frequent_itemsets = apriori(ohe_df, min_support=0.1, use_colnames=True)
        if len(frequent_itemsets) == 0:
            return []
            
        rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=0.5, num_itemsets=2)
        
        if len(rules) == 0:
            return []
            
        # Sort by confidence and lift
        rules = rules.sort_values(['confidence', 'lift'], ascending=[False, False])
        
        combos = []
        for _, row in rules.head(5).iterrows():
            antecedents = list(row['antecedents'])
            consequents = list(row['consequents'])
            combo = antecedents + consequents
            combos.append({
                "combo": combo,
                "confidence": round(row['confidence'], 2),
                "support": round(row['support'], 2),
                "lift": round(row['lift'], 2)
            })
            
        return combos

    def forecast_sales(self, periods=30):
        """
        Uses Prophet to forecast total sales value for the next `periods` days.
        """
        if 'Date' not in self.df.columns:
            return None
            
        # Aggregate sales by Date
        ts_data = self.df.groupby('Date')['Total Sale Value (\u20b9)'].sum().reset_index()
        ts_data.columns = ['ds', 'y']
        
        # Initialize and train Prophet
        m = Prophet(yearly_seasonality=True, daily_seasonality=False)
        m.fit(ts_data)
        
        # Forecast
        future = m.make_future_dataframe(periods=periods)
        forecast = m.predict(future)
        
        # Return the last `periods` predictions
        future_forecast = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(periods)
        
        result = []
        for _, row in future_forecast.iterrows():
            result.append({
                "date": row['ds'].strftime('%Y-%m-%d'),
                "predicted_sales": round(row['yhat'], 2)
            })
            
        return result

if __name__ == "__main__":
    pipeline = MLPipeline()
    print("Combo Suggestions for Diwali:")
    print(pipeline.get_combo_suggestions(festival="Diwali"))
    print("\nForecast for next 7 days:")
    print(pipeline.forecast_sales(periods=7))
