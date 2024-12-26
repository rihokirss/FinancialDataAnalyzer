```markdown
# FinData

FinData is a web application designed to display, compare, and analyze data from various companies. The application is tailored for Estonian users and is developed in the Estonian language. It allows users to add tags to companies for more refined comparisons and historical data analysis. The data is sourced via web scraping from the Estonian Tax and Customs Board's public statistics page.

## Overview

FinData is built using Node.js, Express, and MongoDB, with session-based authentication. The frontend is rendered using EJS templates and styled with Bootstrap 5. The application features a scraper that periodically downloads CSV files containing company data and stores relevant information in a local database.

### Technologies Used

- **Backend**: Node.js, Express
- **Database**: MongoDB, Mongoose ORM
- **Authentication**: Session-based with bcrypt for password hashing
- **Frontend**: EJS view engine, Bootstrap 5
- **Web Scraping**: Custom scraper for downloading and processing CSV files
- **Configuration**: dotenv for environment variable management

### Project Structure

- **models**: Contains Mongoose models for the application
- **routes**: Defines the routes for authentication and main application logic
- **views**: EJS templates for rendering the frontend
- **public**: Static files including Bootstrap CSS and JS
- **scraper**: Logic for web scraping and data processing
- **config**: Configuration files for environment variables

## Features

- **Company Data Display**: View detailed information about companies including taxes paid, turnover, and number of employees.
- **Tagging System**: Add tags to companies for categorization and easier comparison.
- **Data Comparison**: Compare companies based on tags or individually using graphs and tables.
- **Historical Data**: Analyze historical data of companies over different quarters.
- **Manual and Scheduled Scraping**: Configure and run the scraper manually or on a scheduled basis using cron jobs.
- **User Authentication**: Secure login and registration system to protect user data and settings.

## Getting started

### Requirements

- Node.js (version 14.x or higher)
- MongoDB (version 4.x or higher)
- npm (Node package manager)

### Quickstart

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd FinData
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Create a `.env` file in the project root based on the `.env.example` file provided.
   - Update the `.env` file with your MongoDB connection string and other necessary configurations.

4. **Run the application**:
   ```bash
   npm start
   ```

5. **Access the application**:
   - Open your web browser and navigate to `http://localhost:3000`.

### License

The project is proprietary (not open source), just output the standard Copyright (c) 2024.
```