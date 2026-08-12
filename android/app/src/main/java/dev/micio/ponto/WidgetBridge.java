package dev.micio.ponto;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Ponte mínima entre o app web e o widget.
 *
 * O Android só redesenha widget sozinho a cada 30 minutos, no mínimo. Sem
 * este aviso, encerrar o cronômetro dentro do app deixaria o widget contando
 * na tela inicial por meia hora — errado e sem explicação para quem olha.
 *
 * É só isso que o plugin faz: um empurrão. O widget continua lendo os dados
 * por conta própria, direto do SharedPreferences.
 */
@CapacitorPlugin(name = "PontoWidget")
public class WidgetBridge extends Plugin {

    @PluginMethod
    public void refresh(PluginCall call) {
        try {
            PontoWidget.refreshAll(getContext());
            TodayWidget.refreshAll(getContext());
            QuickStartWidget.refreshAll(getContext());
            call.resolve();
        } catch (Exception e) {
            // Widget é conveniência: se falhar, o app não pode falhar junto.
            call.resolve();
        }
    }
}
