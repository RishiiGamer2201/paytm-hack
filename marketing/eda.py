import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os

def run_eda(csv_path="munimai_dataset_5000.csv"):
    output_dir = "static/eda"
    os.makedirs(output_dir, exist_ok=True)
    
    # Load dataset
    print(f"Loading {csv_path}...")
    df = pd.read_csv(csv_path)
    
    # Convert 'Date' column to datetime
    if 'Date' in df.columns:
        df['Date'] = pd.to_datetime(df['Date'])
    
    print("Dataset shape:", df.shape)
    
    # Set style
    sns.set_theme(style="whitegrid")
    
    # 1. Total Sale Value over Time (Monthly aggregation)
    plt.figure(figsize=(12, 6))
    if 'Date' in df.columns:
        monthly_sales = df.set_index('Date').resample('ME')['Total Sale Value (\u20b9)'].sum().reset_index()
        sns.lineplot(data=monthly_sales, x='Date', y='Total Sale Value (\u20b9)', marker='o', linewidth=2)
        plt.title('Total Sale Value Over Time (Monthly)', fontsize=16, fontweight='bold')
        plt.xlabel('Date')
        plt.ylabel('Total Sales (\u20b9)')
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, 'sales_over_time.png'))
        plt.close()
    
    # 2. Sales by Festival/Event
    plt.figure(figsize=(10, 6))
    if 'Festival/Event' in df.columns:
        festival_sales = df.groupby('Festival/Event')['Total Sale Value (\u20b9)'].sum().sort_values(ascending=False).reset_index()
        sns.barplot(data=festival_sales, x='Total Sale Value (\u20b9)', y='Festival/Event', hue='Festival/Event', palette='viridis', legend=False)
        plt.title('Total Sales by Festival/Event', fontsize=16, fontweight='bold')
        plt.xlabel('Total Sales (\u20b9)')
        plt.ylabel('Festival / Event')
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, 'sales_by_festival.png'))
        plt.close()
    
    # 3. Distribution of Demand Level vs Category (Season)
    plt.figure(figsize=(10, 6))
    if 'Season' in df.columns and 'Demand Level (1-10)' in df.columns:
        sns.boxplot(data=df, x='Season', y='Demand Level (1-10)', hue='Season', palette='coolwarm', legend=False)
        plt.title('Demand Level Distribution Across Seasons', fontsize=16, fontweight='bold')
        plt.xlabel('Season')
        plt.ylabel('Demand Level (1-10)')
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, 'demand_by_season.png'))
        plt.close()

    print("EDA completed! Plots saved to", output_dir)

if __name__ == "__main__":
    run_eda()
