"use client";

import { useEffect, useState } from "react";

interface UserInfo {
  username: string;
}

export default function Home() {
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {
        // Ignore fetch errors
      });
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Free Code
        </h1>
        <p className="text-muted-foreground">
          Chat interface coming soon
        </p>
        {user && (
          <p className="text-sm text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{user.username}</span>
          </p>
        )}
      </div>
    </div>
  );
}
