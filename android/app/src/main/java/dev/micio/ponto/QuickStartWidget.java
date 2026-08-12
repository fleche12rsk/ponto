package dev.micio.ponto;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONObject;

import java.util.List;

/**
 * Widget "Início rápido" (2×2): até quatro projetos, um toque começa a contar.
 *
 * Este é o único widget que ESCREVE. Isso cria um segundo autor dos dados, e
 * o app precisa reler ao voltar do segundo plano — senão ele sobrescreveria
 * com o estado que tinha em memória. Esse reload está em `App.tsx`.
 */
public class QuickStartWidget extends AppWidgetProvider {

    static final String ACTION_START = "dev.micio.ponto.QUICK_START";
    static final String EXTRA_PROJECT = "project_id";

    /** Quatro é o que cabe em 2×2 sem virar lista ilegível. */
    private static final int SLOTS = 4;

    private static final int[] ROW_IDS = {
            R.id.quick_slot_0, R.id.quick_slot_1, R.id.quick_slot_2, R.id.quick_slot_3
    };
    private static final int[] NAME_IDS = {
            R.id.quick_name_0, R.id.quick_name_1, R.id.quick_name_2, R.id.quick_name_3
    };
    private static final int[] CLIENT_IDS = {
            R.id.quick_client_0, R.id.quick_client_1, R.id.quick_client_2, R.id.quick_client_3
    };

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] widgetIds) {
        RemoteViews views = buildViews(context);
        for (int id : widgetIds) manager.updateAppWidget(id, views);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);

        if (ACTION_START.equals(intent.getAction())) {
            String projectId = intent.getStringExtra(EXTRA_PROJECT);
            if (projectId != null) {
                PontoData.startTimer(context, projectId);
                // O cronômetro passou a correr: os três widgets mudam junto.
                refreshAll(context);
                PontoWidget.refreshAll(context);
                TodayWidget.refreshAll(context);
            }
        }
    }

    public static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, QuickStartWidget.class));
        if (ids == null || ids.length == 0) return;
        RemoteViews views = buildViews(context);
        for (int id : ids) manager.updateAppWidget(id, views);
    }

    private static RemoteViews buildViews(Context context) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_quick_start);

        JSONObject db = PontoData.read(context);
        List<PontoData.Project> projects = PontoData.recentProjects(db, SLOTS);

        boolean running = db != null && db.optJSONObject("running") != null;
        views.setTextViewText(
                R.id.quick_title,
                running ? "Contando agora" : "Começar");

        if (projects.isEmpty()) {
            views.setViewVisibility(R.id.quick_empty, View.VISIBLE);
            views.setOnClickPendingIntent(R.id.quick_root, PontoWidget.WidgetIntents.openApp(context));
            for (int slot : ROW_IDS) views.setViewVisibility(slot, View.GONE);
            return views;
        }

        views.setViewVisibility(R.id.quick_empty, View.GONE);

        for (int i = 0; i < SLOTS; i++) {
            if (i >= projects.size()) {
                views.setViewVisibility(ROW_IDS[i], View.INVISIBLE);
                continue;
            }
            PontoData.Project p = projects.get(i);
            views.setViewVisibility(ROW_IDS[i], View.VISIBLE);
            views.setTextViewText(NAME_IDS[i], p.name);
            views.setTextViewText(CLIENT_IDS[i], p.clientName);

            Intent start = new Intent(context, QuickStartWidget.class);
            start.setAction(ACTION_START);
            start.putExtra(EXTRA_PROJECT, p.id);
            /*
              O requestCode precisa ser diferente por projeto. Com o mesmo
              código o Android reaproveita o PendingIntent e todos os botões
              acabariam iniciando o mesmo projeto.
            */
            PendingIntent pending = PendingIntent.getBroadcast(
                    context, p.id.hashCode(), start,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(ROW_IDS[i], pending);
        }

        return views;
    }
}
