import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, AlertTriangle } from "lucide-react";

interface SchoologyConnection {
  id: string;
  schoology_user_id: string | null;
  created_at: string;
}

const FN_NETWORK_ERROR = "Couldn't reach the Schoology integration service. Please try again.";

export default function SettingsSchoology() {
  const { user, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();

  const [connection, setConnection] = useState<SchoologyConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Connect form state — Schoology uses two-legged OAuth 1.0a, so the teacher
  // pastes their own API key/secret. There is no redirect/authorize flow.
  const [consumerKey, setConsumerKey] = useState("");
  const [consumerSecret, setConsumerSecret] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Auth gate
  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/login?returnTo=${encodeURIComponent("/settings/schoology")}`, { replace: true });
    }
  }, [authLoading, user, navigate]);

  const fetchConnection = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setFetchError(null);
    const { data, error } = await supabase
      .from("schoology_connections")
      .select("id, schoology_user_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      setFetchError(error.message);
      setConnection(null);
    } else {
      setConnection(data as SchoologyConnection | null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) fetchConnection();
  }, [user, fetchConnection]);

  const handleConnect = async () => {
    const key = consumerKey.trim();
    const secret = consumerSecret.trim();
    if (!key || !secret) {
      toast.error("Enter both your Schoology consumer key and secret.");
      return;
    }
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("schoology-connect", {
        body: { consumerKey: key, consumerSecret: secret },
      });
      if (error || data?.error) {
        toast.error(data?.error || error?.message || FN_NETWORK_ERROR);
        return;
      }
      toast.success("Schoology connected successfully");
      // Don't keep the secret in component state any longer than needed.
      setConsumerKey("");
      setConsumerSecret("");
      await fetchConnection();
    } catch {
      toast.error(FN_NETWORK_ERROR);
    } finally {
      setConnecting(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("schoology-sections", { method: "GET" });
      if (error || data?.error) {
        toast.error(data?.error || error?.message || FN_NETWORK_ERROR);
      } else {
        const n = data?.sections?.length ?? 0;
        toast.success(`Connection working — found ${n} section${n === 1 ? "" : "s"}`);
      }
    } catch {
      toast.error(FN_NETWORK_ERROR);
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connection) return;
    setDisconnecting(true);
    const { error } = await supabase.from("schoology_connections").delete().eq("id", connection.id);
    setDisconnecting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Schoology disconnected.");
    await fetchConnection();
  };

  if (authLoading || !user) {
    return (
      <div className="container max-w-2xl py-10">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Schoology integration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your Schoology LMS connection.
        </p>
      </div>

      {loading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-72 mt-2" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      ) : fetchError ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>Failed to load Schoology connection: {fetchError}</span>
            <Button size="sm" variant="outline" onClick={fetchConnection}>Retry</Button>
          </AlertDescription>
        </Alert>
      ) : connection ? (
        <ConnectedCard
          connection={connection}
          onTest={handleTest}
          testing={testing}
          onDisconnect={handleDisconnect}
          disconnecting={disconnecting}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Connect your Schoology account</CardTitle>
            <CardDescription>
              Paste the API consumer key and secret from your Schoology account
              (your account menu → API). RealPath stores them encrypted and uses
              them only to push lessons into your sections. You can disconnect at
              any time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="schoology-key">Consumer Key</Label>
              <Input
                id="schoology-key"
                type="password"
                placeholder="Your Schoology consumer key"
                value={consumerKey}
                onChange={(e) => setConsumerKey(e.target.value)}
                disabled={connecting}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schoology-secret">Consumer Secret</Label>
              <Input
                id="schoology-secret"
                type="password"
                placeholder="Your Schoology consumer secret"
                value={consumerSecret}
                onChange={(e) => setConsumerSecret(e.target.value)}
                disabled={connecting}
                autoComplete="off"
              />
            </div>
            <Button
              onClick={handleConnect}
              disabled={connecting || !consumerKey.trim() || !consumerSecret.trim()}
            >
              {connecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Connect Schoology
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ConnectedCard({
  connection,
  onTest,
  testing,
  onDisconnect,
  disconnecting,
}: {
  connection: SchoologyConnection;
  onTest: () => void;
  testing: boolean;
  onDisconnect: () => void;
  disconnecting: boolean;
}) {
  const fmt = (iso: string | null) => (iso ? format(new Date(iso), "MMM d, yyyy h:mm a") : "—");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle>Schoology connected</CardTitle>
          <Badge className="bg-green-600 hover:bg-green-600 text-white">Connected</Badge>
        </div>
        <CardDescription>Two-legged API connection (your personal key).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Schoology user ID</dt>
          <dd className="sm:col-span-2 font-medium">{connection.schoology_user_id ?? "—"}</dd>
          <dt className="text-muted-foreground">Connected since</dt>
          <dd className="sm:col-span-2 font-medium">{fmt(connection.created_at)}</dd>
        </dl>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="secondary" onClick={onTest} disabled={testing}>
            {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Test Connection
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={disconnecting}>
                {disconnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Disconnect
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect Schoology?</AlertDialogTitle>
                <AlertDialogDescription>
                  You'll need to re-enter your API key and secret to push lessons again.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDisconnect}>Disconnect</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
