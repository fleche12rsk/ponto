package dev.micio.ponto;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Precisa vir ANTES do super: é o super que monta a ponte e lê a
        // lista de plugins registrados.
        registerPlugin(WidgetBridge.class);
        super.onCreate(savedInstanceState);
    }
}
