package dev.micio.ponto;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.SystemClock;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONObject;

/**
 * Widget do cronômetro (2×1).
 *
 * O tempo corre sozinho graças ao Chronometer: informamos o instante em que a
 * contagem começou e ele conta na tela sem o widget se redesenhar. É por isso
 * que o app guardar `started_at` em vez de um contador acumulado importa
 * também aqui.
 *
 * Quando nada está rodando, vira resumo do dia — um widget que só serve
 * enquanto você trabalha ficaria morto a maior parte do tempo.
 */
public class PontoWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] widgetIds) {
        RemoteViews views = buildViews(context);
        for (int id : widgetIds) manager.updateAppWidget(id, views);
    }

    /** Redesenha agora. Chamado pelo app quando o cronômetro muda de estado. */
    public static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, PontoWidget.class));
        if (ids == null || ids.length == 0) return;
        RemoteViews views = buildViews(context);
        for (int id : ids) manager.updateAppWidget(id, views);
    }

    private static RemoteViews buildViews(Context context) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_timer);
        views.setOnClickPendingIntent(R.id.widget_root, WidgetIntents.openApp(context));

        JSONObject db = PontoData.read(context);
        if (db == null) {
            fillIdle(views, "Abra o app para começar", null);
            return views;
        }

        JSONObject running = db.optJSONObject("running");
        if (running == null) {
            fillIdle(views, "Nenhum cronômetro", PontoData.formatDuration(PontoData.todaySeconds(db)));
            return views;
        }

        PontoData.Project project = PontoData.findProject(db, running.optString("project_id", ""));
        views.setTextViewText(R.id.widget_project, project == null ? "Projeto" : project.name);
        views.setTextViewText(R.id.widget_client, project == null ? "" : project.clientName);
        views.setViewVisibility(R.id.widget_client, View.VISIBLE);

        long elapsedMs = PontoData.elapsedMillis(running);

        if ("running".equals(running.optString("state", "running"))) {
            views.setViewVisibility(R.id.widget_chronometer, View.VISIBLE);
            views.setViewVisibility(R.id.widget_static_time, View.GONE);
            // Base no relógio monotônico: mudar o horário do celular não
            // bagunça a contagem.
            views.setChronometer(
                    R.id.widget_chronometer,
                    SystemClock.elapsedRealtime() - elapsedMs,
                    null,
                    true);
        } else {
            // Pausado: o Chronometer não congela num valor, então vira texto.
            views.setViewVisibility(R.id.widget_chronometer, View.GONE);
            views.setViewVisibility(R.id.widget_static_time, View.VISIBLE);
            views.setTextViewText(R.id.widget_static_time, PontoData.clockOf(elapsedMs / 1000));
        }

        return views;
    }

    private static void fillIdle(RemoteViews views, String title, String subtitle) {
        views.setTextViewText(R.id.widget_project, title);
        views.setViewVisibility(R.id.widget_chronometer, View.GONE);
        views.setViewVisibility(R.id.widget_static_time, View.VISIBLE);
        views.setTextViewText(R.id.widget_static_time, subtitle == null ? "--" : subtitle);
        views.setViewVisibility(R.id.widget_client, subtitle == null ? View.GONE : View.VISIBLE);
        if (subtitle != null) views.setTextViewText(R.id.widget_client, "hoje");
    }

    /* ---------- Intents compartilhadas entre os widgets ---------- */

    static final class WidgetIntents {
        private WidgetIntents() {}

        static PendingIntent openApp(Context context) {
            Intent open = new Intent(context, MainActivity.class);
            open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            return PendingIntent.getActivity(
                    context, 0, open,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        }
    }
}
