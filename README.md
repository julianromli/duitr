# Duitr - Personal Finance Manager

**Duitr** is a modern and intuitive personal finance management application, built with a cutting-edge web stack. This app empowers you to effortlessly track your expenses, manage your budgets, and achieve your financial goals.

## 🚀 Key Features

### 💰 Transaction Management

  - **Expense Logging**: Record all your expenses with customizable categories.
  - **Income Tracking**: Manage your various sources of income.
  - **Wallet Transfers**: Seamlessly move funds between your wallets.
  - **Transaction History**: View all transactions with advanced filtering and search capabilities.
  - **Transaction Details**: Access comprehensive information for every transaction.

### 📊 Dashboard & Analytics

  - **Aggregated Balance**: See the total balance from all your wallets at a glance.
  - **Expense Charts**: Visualize your monthly spending patterns.
  - **Recent Transactions**: Get quick access to your latest transactions.
  - **Financial Statistics**: Gain deep insights into your financial habits.

### 🎯 Budget Management

  - **Budget Creation**: Set up budgets for various spending categories.
  - **Progress Tracking**: Monitor your budget adherence in real-time.
  - **Budget Alerts**: Receive notifications when you're approaching your budget limits.
  - **Wishlist**: Manage items you plan to purchase.
  - **Loan Management**: Record and manage your loans.

### 💳 Wallet Management

  - **Multi-Wallet Support**: Manage various wallet types (e.g., cash, bank accounts, e-wallets).
  - **Real-time Balance**: Enjoy automatic balance updates.
  - **Wallet Categories**: Organize your wallets by type for better clarity.

### 🌐 Additional Features

  - **Multi-language**: Support for both English and Indonesian.
  - **Dark/Light Mode**: Choose a theme that suits your preference.
  - **PWA (Progressive Web App)**: Installable on your mobile devices.
  - **Offline Support**: Functions seamlessly without an internet connection.
  - **Data Export**: Export your data to Excel/CSV formats.
  - **Responsive Design**: Optimized for a perfect experience on both desktop and mobile.

## 🛠️ Tech Stack

### Frontend

  - **React 18** - A modern UI library.
  - **TypeScript** - For type safety and an enhanced developer experience.
  - **Vite** - A blazing-fast build tool.
  - **Tailwind CSS** - A utility-first CSS framework.
  - **shadcn/ui** - A collection of customizable UI components.
  - **Framer Motion** - For creating smooth animations.
  - **React Router** - For application routing.
  - **React Hook Form** - For efficient form management.
  - **Zod** - For schema validation.

### Backend & Database

  - **Supabase** - A comprehensive Backend-as-a-Service platform.
  - **PostgreSQL** - A powerful relational database.
  - **Row Level Security** - Ensuring row-level data security.

### State Management & Data Fetching

  - **React Query (TanStack Query)** - For server state management.
  - **React Context** - For client state management.

### Internationalization

  - **i18next** - An internationalization framework.
  - **react-i18next** - React integration for i18next.

### PWA & Performance

  - **Vite PWA Plugin** - To enable Progressive Web App capabilities.
  - **Service Worker** - For caching and offline support.
  - **Web App Manifest** - For app installation metadata.

## 📱 Installation and Setup

### Prerequisites

  - Node.js (v18 or newer)
  - npm or yarn
  - A Supabase account

### Installation Steps

1.  **Clone the repository**

    ```bash
    git clone <repository-url>
    cd duitr
    ```

2.  **Install dependencies**

    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up environment variables**

    ```bash
    cp .env.example .env
    ```

    Edit the `.env` file and add your Supabase configuration:

    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Set up the database**

      - Run the SQL scripts located in the `supabase/migrations/` folder.
      - Import the schema from `supabase_schema.sql`.

5.  **Run the application**

    ```bash
    npm run dev
    # or
    yarn dev
    ```

    The application will be running at `http://localhost:5173`.

## 🏗️ Project Structure

```
src/
├── components/          # React Components
│   ├── app/            # Core application components
│   ├── auth/           # Authentication components
│   ├── budget/         # Budgeting components
│   ├── dashboard/      # Dashboard components
│   ├── layout/         # Layout components
│   ├── shared/         # Shared components
│   ├── transactions/   # Transaction components
│   ├── ui/             # Base UI components
│   └── wallets/        # Wallet components
├── context/            # React Context providers
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configurations
├── pages/              # Page components
├── services/           # Service layer
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## 🎨 Customization

### Logo and Branding

Duitr uses a centralized logo system for easy customization:

1.  **Base Logo** (`src/components/ui/logo.tsx`)

    ```tsx
    import Logo from '@/components/ui/logo';

    // Basic usage
    <Logo size={32} variant="default" />

    // With custom colors
    <Logo size={48} bgColor="#ff0000" color="#ffffff" />

    // Shape variations
    <Logo size={32} variant="square" />
    <Logo size={32} variant="circle" />
    <Logo size={32} variant="text-only" />
    ```

2.  **AppLogo** (`src/components/shared/Logo.tsx`)

    ```tsx
    import AppLogo from '@/components/shared/Logo';

    // Logo with text
    <AppLogo size={32} withText={true} />

    // Logo only
    <AppLogo size={32} withText={false} />

    // Logo with a link
    <AppLogo linkTo="/" />
    ```

### Changing the Logo

1.  Edit the `public/duitr-logo.svg` file.
2.  Use `public/logo-generator.html` to generate the assets.
3.  Visit `/logo-generator.html` in your browser.

### Favicon Customization

1.  Visit `/favicon-customizer.html`.
2.  Adjust the color, size, and radius.
3.  Preview and download the new favicon.

## 🚀 Build and Deploy

### Development Build

```bash
npm run build:dev
```

### Production Build

```bash
npm run build
```

### PWA Build

```bash
npm run build:pwa
```

### Deploy to Vercel

```bash
npm run vercel:deploy
```

## 📊 Database Schema

The application uses Supabase with the following schema:

  - **users** - User data
  - **wallets** - User wallets
  - **categories** - Transaction categories
  - **transactions** - Financial transactions
  - **budgets** - User budgets
  - **want\_to\_buy** - Wishlist items
  - **pinjaman** - Loan data

## 🔒 Security

  - **Row Level Security (RLS)** - User data is isolated.
  - **JWT Authentication** - Secure authentication flow.
  - **Environment Variables** - Sensitive configurations are kept secret.
  - **Input Validation** - Data validation powered by Zod.

## 🌍 Internationalization

The application supports multiple languages:

  - Indonesian (default)
  - English

Translation files are stored in `src/locales/`.

## 📱 PWA Features

  - **Installable** - Can be installed on your device.
  - **Offline Support** - Works without an internet connection.
  - **Push Notifications** - (Coming soon)
  - **Background Sync** - Automatic data synchronization.
  - **App Shortcuts** - Shortcuts to key features.

## 🤝 Contributing

1.  Fork the repository.
2.  Create a new feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](https://www.google.com/search?q=LICENSE) file for details.

## 📞 Support

If you encounter any issues or have questions:

  - Create an issue in the GitHub repository.
  - Contact the development team.

## 🔄 Changelog

### v1.0.0

  - ✅ Complete transaction management
  - ✅ Dashboard with analytics
  - ✅ Budgeting system
  - ✅ Multi-wallet support
  - ✅ PWA support
  - ✅ Multi-language
  - ✅ Data export

-----

**Duitr** - Manage your finances with ease and efficiency\! 💰✨