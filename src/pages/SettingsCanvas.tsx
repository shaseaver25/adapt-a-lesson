import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
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
import { Loader2, ExternalLink, AlertTriangle } from "lucide-react";

interface CanvasConnection {
  id: string;
  canvas_instance_url: string;
  canvas_user_id: number | null;
  token_expires_at: string | null;
  created_at: string;
}

const FN_NETWORK_ERROR = "Couldn't reach the Canvas integration service. Please try again.";

export default function SettingsCanvas() {
  const { user, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [connection, setConnection] = useState<CanvasConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Connect form state
  const devDefault = import.meta.env.DEV ? (import.meta.env.VITE_CANVAS_DEV_URL as string | undefined) ?? "" : "";
  const [canvasUrl, setCanvasUrl] = useState(devDefault);
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Auth gate
  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/login?returnTo=${encodeURIComponent("/settings/canvas")}`, { replace: true });
    }
  }, [authLoading, user, navigate]);

  const fetchConnection = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setFetchError(null);
    const { data, error } = await supabase
      .from("canvas_connections")
      .select("id, canvas_instance_url, canvas_user_id, token_expires_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      setFetchError(error.message);
      setConnection(null);
    } else {
      setConnection(data as CanvasConnection | null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) fetchConnection();
  }, [user, fetchConnection]);

  // Handle ?connected=1
  useEffect(() => {
    if (searchParams.get("connected") === "1") {
      toast.success("Canvas connected successfully");
      const next = new URLSearchParams(searchParams);
      next.delete("connected");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateUrl = (url: string): string | null => {
    const trimmed = url.trim().replace(/\/+$/, "");
    if (!trimmed.startsWith("https://")) return "Canvas URL must start with https://";
    if (!trimmed.includes(".")) return "Canvas URL must include a domain (e.g. school.instructure.com)";
    return null;
  };

  const handleConnect = async () => {
    const trimmed = canvasUrl.trim().replace(/\/+$/, "");
    const err = validateUrl(trimmed);
    if (err) {
      toast.error(err);
      return;
    }
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("canvas-oauth-start", {
        body: { canvasInstanceUrl: trimmed },
      });
      if (error) {
        toast.error(error.message || FN_NETWORK_ERROR);
        setConnecting(false);
        return;
      }
      if (!data?.authorizeUrl) {
        toast.error("Canvas authorize URL was not returned.");
        setConnecting(false);
        return;
      }
      window.location.href = data.authorizeUrl;
    } catch {
      toast.error(FN_NETWORK_ERROR);
      setConnecting(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("canvas-courses", { body: {} });
      if (error) {
        toast.error(error.message || FN_NETWORK_ERROR);
      } else {
        const n = data?.courses?.length ?? 0;
        toast.success(`Connection working — found ${n} course${n === 1 ? "" : "s"}`);
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
    const { error } = await supabase.from("canvas_connections").delete().eq("id", connection.id);
    setDisconnecting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Canvas disconnected.");
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
        <h1 className="text-2xl font-semibold tracking-tight">Canvas integration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your Canvas LMS connection.
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
            <span>Failed to load Canvas connection: {fetchError}</span>
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
            <CardTitle>Connect your Canvas account</CardTitle>
            <CardDescription>
              Connect RealPath to your Canvas account to push lessons directly into your courses.
              We store an encrypted access token, never your password. You can disconnect at any time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="canvas-url">Canvas URL</Label>
              <Input
                id="canvas-url"
                type="url"
                placeholder="https://your-school.instructure.com"
                value={canvasUrl}
                onChange={(e) => setCanvasUrl(e.target.value)}
                disabled={connecting}
                autoComplete="off"
              />
            </div>
            <Button onClick={handleConnect} disabled={connecting || !canvasUrl.trim()}>
              {connecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Connect Canvas
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
  connection: CanvasConnection;
  onTest: () => void;
  testing: boolean;
  onDisconnect: () => void;
  disconnecting: boolean;
}) {
  const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at) : null;
  const now = Date.now();
  const expired = expiresAt ? expiresAt.getTime() < now : false;
  const expiringSoon = expiresAt ? !expired && expiresAt.getTime() - now < 10 * 60 * 1000 : false;

  const fmt = (iso: string | null) => (iso ? format(new Date(iso), "MMM d, yyyy h:mm a") : "—");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle>Canvas connected</CardTitle>
          <Badge className="bg-green-600 hover:bg-green-600 text-white">Connected</Badge>
        </div>
        <CardDescription>
          <a
            href={connection.canvas_instance_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline break-all"
          >
            {connection.canvas_instance_url}
            <ExternalLink className="h-3 w-3" />
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {expired && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Access token expired — reconnect to push lessons.</AlertDescription>
          </Alert>
        )}
        {expiringSoon && (
          <Alert className="border-yellow-500/50 bg-yellow-500/10 text-yellow-900 dark:text-yellow-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Token expires soon — reconnect if you plan to push lessons in the next few minutes.
            </AlertDescription>
          </Alert>
        )}

        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Canvas user ID</dt>
          <dd className="sm:col-span-2 font-medium">{connection.canvas_user_id ?? "—"}</dd>
          <dt className="text-muted-foreground">Connected since</dt>
          <dd className="sm:col-span-2 font-medium">{fmt(connection.created_at)}</dd>
          <dt className="text-muted-foreground">Token expires</dt>
          <dd className="sm:col-span-2 font-medium">{fmt(connection.token_expires_at)}</dd>
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
                <AlertDialogTitle>Disconnect Canvas?</AlertDialogTitle>
                <AlertDialogDescription>
                  You'll need to re-authorize to push lessons again.
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