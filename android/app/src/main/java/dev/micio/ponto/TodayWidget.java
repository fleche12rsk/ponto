package dev.micio.ponto;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.widget.RemoteViews;

import org.json.JSONObject;

/**
 * Widget "Hoje" (2×1): quanto você já trabalhou e quanto isso vale.
 *
 * Só leitura. Diferente do cronômetro, aqui não tem nada correndo — o número
 * só muda quando um registro é salvo, e o app avisa quando isso acontece.
 */
public class TodayWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] widgetIds) {
        RemoteViews views = buildViews(context);
        for (int id : widgetIds) manager.updateAppWidget(id, views);
    }

    public static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, TodayWidget.class));
        if (ids == null || ids.length == 0) return;
        RemoteViews views = buildViews(context);
        for (int id : ids) manager.updateAppWidget(id, views);
    }

    private static RemoteViews buildViews(Context context) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_today);
        views.setOnClickPendingIntent(R.id.widget_root, PontoWidget.WidgetIntents.openApp(context));

        JSONObject db = PontoData.read(context);
        long seconds = db == null ? 0 : PontoData.todaySeconds(db);
        long cents = db == null ? 0 : PontoData.todayCents(db);

        views.setTextViewText(R.id.today_hours, PontoData.formatDuration(seconds));
        views.setTextViewText(R.id.today_money, PontoData.formatMoney(cents));
        return views;
    }
}
