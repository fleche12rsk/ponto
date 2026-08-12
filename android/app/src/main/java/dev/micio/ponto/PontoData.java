package dev.micio.ponto;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

/**
 * Leitura e escrita do banco do Ponto pelo lado nativo.
 *
 * O app grava com o Capacitor Preferences, que no Android é um
 * SharedPreferences comum. Widget do mesmo pacote abre esse arquivo direto —
 * é o que dispensa servidor, banco separado ou canal de comunicação.
 *
 * Tudo aqui é tolerante a falha de propósito: um widget que lança exceção
 * vira aquele retângulo cinza de "não foi possível carregar" na tela inicial.
 */
final class PontoData {

    private static final String PREFS = "CapacitorStorage";
    private static final String DB_KEY = "ponto.db.v1";

    private PontoData() {}

    static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static JSONObject read(Context context) {
        try {
            String raw = prefs(context).getString(DB_KEY, null);
            return raw == null ? null : new JSONObject(raw);
        } catch (Exception e) {
            return null;
        }
    }

    static void write(Context context, JSONObject db) {
        prefs(context).edit().putString(DB_KEY, db.toString()).apply();
    }

    /* ---------- Cronômetro ---------- */

    /** Milissegundos já contados, somando o acumulado ao trecho em curso. */
    static long elapsedMillis(JSONObject running) {
        long accumulated = running.optLong("accumulated_seconds", 0) * 1000L;
        if (!"running".equals(running.optString("state", "running"))) return accumulated;

        long startedAt = parseIso(running.optString("started_at", null));
        if (startedAt <= 0) return accumulated;
        return accumulated + Math.max(0, System.currentTimeMillis() - startedAt);
    }

    /** Começa a contar um projeto agora, escrevendo direto no armazenamento. */
    static void startTimer(Context context, String projectId) {
        JSONObject db = read(context);
        if (db == null) return;
        try {
            JSONObject running = new JSONObject();
            running.put("project_id", projectId);
            running.put("started_at", isoNow());
            running.put("accumulated_seconds", 0);
            running.put("state", "running");
            running.put("paused_at", JSONObject.NULL);
            db.put("running", running);
            write(context, db);
        } catch (Exception ignored) {
        }
    }

    /* ---------- Projetos e clientes ---------- */

    static class Project {
        final String id;
        final String name;
        final String clientName;
        final String clientColor;

        Project(String id, String name, String clientName, String clientColor) {
            this.id = id;
            this.name = name;
            this.clientName = clientName;
            this.clientColor = clientColor;
        }
    }

    static Project findProject(JSONObject db, String projectId) {
        try {
            JSONArray projects = db.optJSONArray("projects");
            if (projects == null) return null;
            for (int i = 0; i < projects.length(); i++) {
                JSONObject p = projects.getJSONObject(i);
                if (projectId.equals(p.optString("id"))) return toProject(db, p);
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    /**
     * Os projetos usados mais recentemente, do mais recente para o mais antigo.
     * Ordena pelos registros — o mesmo critério do "Recente" dentro do app,
     * para o widget não sugerir uma ordem diferente da que a pessoa vê lá.
     */
    static List<Project> recentProjects(JSONObject db, int limit) {
        List<Project> result = new ArrayList<>();
        if (db == null) return result;

        try {
            JSONArray projects = db.optJSONArray("projects");
            if (projects == null) return result;

            // Último uso de cada projeto, a partir dos registros.
            JSONArray entries = db.optJSONArray("entries");
            List<String> ordered = new ArrayList<>();
            if (entries != null) {
                long[] lastUse = new long[projects.length()];
                String[] ids = new String[projects.length()];
                for (int i = 0; i < projects.length(); i++) {
                    ids[i] = projects.getJSONObject(i).optString("id");
                }
                for (int i = 0; i < entries.length(); i++) {
                    JSONObject e = entries.getJSONObject(i);
                    String pid = e.optString("project_id");
                    long t = parseIso(e.optString("created_at", null));
                    for (int j = 0; j < ids.length; j++) {
                        if (ids[j].equals(pid) && t > lastUse[j]) lastUse[j] = t;
                    }
                }
                // Ordena por último uso, decrescente.
                Integer[] idx = new Integer[ids.length];
                for (int i = 0; i < ids.length; i++) idx[i] = i;
                java.util.Arrays.sort(idx, (a, b) -> Long.compare(lastUse[b], lastUse[a]));
                for (Integer i : idx) ordered.add(ids[i]);
            }

            for (String id : ordered) {
                if (result.size() >= limit) break;
                Project p = findProject(db, id);
                if (p != null) result.add(p);
            }
            // Completa com quem nunca foi usado, para projeto novo aparecer.
            for (int i = 0; i < projects.length() && result.size() < limit; i++) {
                Project p = toProject(db, projects.getJSONObject(i));
                boolean already = false;
                for (Project r : result) if (r.id.equals(p.id)) already = true;
                if (!already) result.add(p);
            }
        } catch (Exception ignored) {
        }
        return result;
    }

    private static Project toProject(JSONObject db, JSONObject p) {
        String clientName = "";
        String color = "#8F8A7C";
        try {
            String clientId = p.optString("client_id", null);
            JSONArray clients = db.optJSONArray("clients");
            if (clients != null && clientId != null) {
                for (int i = 0; i < clients.length(); i++) {
                    JSONObject c = clients.getJSONObject(i);
                    if (clientId.equals(c.optString("id"))) {
                        clientName = c.optString("name", "");
                        color = c.optString("color", color);
                        break;
                    }
                }
            }
        } catch (Exception ignored) {
        }
        return new Project(p.optString("id"), p.optString("name", "Projeto"), clientName, color);
    }

    /* ---------- Totais do dia ---------- */

    static long todaySeconds(JSONObject db) {
        long total = 0;
        try {
            JSONArray entries = db.optJSONArray("entries");
            if (entries == null) return 0;
            long from = startOfToday();
            for (int i = 0; i < entries.length(); i++) {
                JSONObject e = entries.getJSONObject(i);
                if (e.isNull("ended_at")) continue;
                if (parseIso(e.optString("started_at", null)) >= from) {
                    total += e.optLong("duration_seconds", 0);
                }
            }
        } catch (Exception ignored) {
        }
        return total;
    }

    static long todayCents(JSONObject db) {
        long total = 0;
        try {
            JSONArray entries = db.optJSONArray("entries");
            if (entries == null) return 0;
            long from = startOfToday();
            for (int i = 0; i < entries.length(); i++) {
                JSONObject e = entries.getJSONObject(i);
                if (e.isNull("ended_at")) continue;
                if (parseIso(e.optString("started_at", null)) >= from) {
                    long seconds = e.optLong("duration_seconds", 0);
                    long rate = e.optLong("rate_cents_snapshot", 0);
                    total += Math.round((seconds / 3600.0) * rate);
                }
            }
        } catch (Exception ignored) {
        }
        return total;
    }

    private static long startOfToday() {
        Calendar c = Calendar.getInstance();
        c.set(Calendar.HOUR_OF_DAY, 0);
        c.set(Calendar.MINUTE, 0);
        c.set(Calendar.SECOND, 0);
        c.set(Calendar.MILLISECOND, 0);
        return c.getTimeInMillis();
    }

    /* ---------- Datas e formatação ---------- */

    static long parseIso(String iso) {
        if (iso == null || iso.isEmpty()) return 0;
        String[] patterns = {
                "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
                "yyyy-MM-dd'T'HH:mm:ssXXX",
        };
        for (String pattern : patterns) {
            try {
                return new SimpleDateFormat(pattern, Locale.US).parse(iso).getTime();
            } catch (ParseException | NullPointerException ignored) {
            }
        }
        return 0;
    }

    /** Mesmo formato que o `toISOString()` do JavaScript produz. */
    static String isoNow() {
        SimpleDateFormat f = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        f.setTimeZone(TimeZone.getTimeZone("UTC"));
        return f.format(new Date());
    }

    /** `4h 45min`, igual ao app. */
    static String formatDuration(long seconds) {
        long h = seconds / 3600;
        long m = Math.round((seconds % 3600) / 60.0);
        if (m == 60) {
            h += 1;
            m = 0;
        }
        if (h == 0) return m + "min";
        if (m == 0) return h + "h";
        return h + "h " + m + "min";
    }

    /** `R$ 1.082,27` */
    static String formatMoney(long cents) {
        long units = cents / 100;
        long rest = Math.abs(cents % 100);
        StringBuilder sb = new StringBuilder(String.valueOf(Math.abs(units)));
        for (int i = sb.length() - 3; i > 0; i -= 3) sb.insert(i, '.');
        String sign = cents < 0 ? "-" : "";
        return String.format(Locale.US, "%sR$ %s,%02d", sign, sb, rest);
    }

    static String clockOf(long seconds) {
        return String.format(Locale.US, "%02d:%02d:%02d",
                seconds / 3600, (seconds % 3600) / 60, seconds % 60);
    }
}
