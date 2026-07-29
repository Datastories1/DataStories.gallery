import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/context/CartContext"; 
import CartSidebar from "@/components/CartSidebar"; 
import ClientLayoutContent from "./ClientLayoutContent";
import "./RootLayout.css";

export const metadata = {
  title: "DataStories Gallery | Future To BI",
  description: "Premium Power BI dashboard templates",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="dm-sans syne">
        <SessionProvider>
          <CartProvider>
            <ClientLayoutContent>{children}</ClientLayoutContent>
            <CartSidebar />
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}