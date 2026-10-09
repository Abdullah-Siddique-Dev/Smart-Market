#include <windows.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Check if a TCP port is currently open and accepting connections
static int isPortListening(int port) {
    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) return 0;

    SOCKET sock = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (sock == INVALID_SOCKET) {
        WSACleanup();
        return 0;
    }

    struct sockaddr_in target;
    target.sin_family = AF_INET;
    target.sin_port = htons((unsigned short)port);
    target.sin_addr.s_addr = inet_addr("127.0.0.1");

    int res = connect(sock, (struct sockaddr*)&target, sizeof(target));
    closesocket(sock);
    WSACleanup();
    return (res == 0);
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    // 1. Resolve application root directory
    char exePath[MAX_PATH];
    GetModuleFileNameA(NULL, exePath, MAX_PATH);
    char *lastBackslash = strrchr(exePath, '\\');
    if (lastBackslash != NULL) {
        *lastBackslash = '\0';
    }
    SetCurrentDirectoryA(exePath);

    // 2. Start local SQLite backend server if not already running on port 4000
    if (!isPortListening(4000)) {
        STARTUPINFOA siServer;
        PROCESS_INFORMATION piServer;
        ZeroMemory(&siServer, sizeof(siServer));
        siServer.cb = sizeof(siServer);
        siServer.dwFlags = STARTF_USESHOWWINDOW;
        siServer.wShowWindow = SW_HIDE;
        ZeroMemory(&piServer, sizeof(piServer));

        char serverCmd[MAX_PATH * 2];
        snprintf(serverCmd, sizeof(serverCmd), "node.exe \"%s\\server\\dist\\server.js\"", exePath);

        BOOL started = CreateProcessA(
            NULL,
            serverCmd,
            NULL,
            NULL,
            FALSE,
            CREATE_NO_WINDOW,
            NULL,
            exePath,
            &siServer,
            &piServer
        );

        if (started) {
            // Wait up to 6 seconds for port 4000 to become active
            for (int i = 0; i < 30; i++) {
                Sleep(200);
                if (isPortListening(4000)) break;
            }
            CloseHandle(piServer.hProcess);
            CloseHandle(piServer.hThread);
        }
    }

    // 3. Check if Tauri native desktop executable exists
    char tauriExe[MAX_PATH];
    snprintf(tauriExe, sizeof(tauriExe), "%s\\smartmarket.exe", exePath);
    if (GetFileAttributesA(tauriExe) == INVALID_FILE_ATTRIBUTES) {
        snprintf(tauriExe, sizeof(tauriExe), "%s\\src-tauri\\target\\release\\smartmarket.exe", exePath);
    }

    DWORD attribs = GetFileAttributesA(tauriExe);
    if (attribs != INVALID_FILE_ATTRIBUTES && !(attribs & FILE_ATTRIBUTE_DIRECTORY)) {
        STARTUPINFOA siTauri;
        PROCESS_INFORMATION piTauri;
        ZeroMemory(&siTauri, sizeof(siTauri));
        siTauri.cb = sizeof(siTauri);
        ZeroMemory(&piTauri, sizeof(piTauri));

        CreateProcessA(tauriExe, NULL, NULL, NULL, FALSE, 0, NULL, exePath, &siTauri, &piTauri);
        CloseHandle(piTauri.hProcess);
        CloseHandle(piTauri.hThread);
        return 0;
    }

    // 4. Otherwise, launch native WebView2 desktop window via Edge App mode
    char edgeExe[MAX_PATH] = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
    char profileDir[MAX_PATH];
    snprintf(profileDir, sizeof(profileDir), "%s\\data\\app-profile", exePath);

    char edgeCmd[MAX_PATH * 3];
    snprintf(edgeCmd, sizeof(edgeCmd), "\"%s\" --app=\"http://127.0.0.1:4000\" --user-data-dir=\"%s\" --window-size=1440,900", edgeExe, profileDir);

    STARTUPINFOA siApp;
    PROCESS_INFORMATION piApp;
    ZeroMemory(&siApp, sizeof(siApp));
    siApp.cb = sizeof(siApp);
    ZeroMemory(&piApp, sizeof(piApp));

    BOOL appStarted = CreateProcessA(
        edgeExe,
        edgeCmd,
        NULL,
        NULL,
        FALSE,
        0,
        NULL,
        exePath,
        &siApp,
        &piApp
    );

    if (appStarted) {
        CloseHandle(piApp.hProcess);
        CloseHandle(piApp.hThread);
    } else {
        ShellExecuteA(NULL, "open", "http://127.0.0.1:4000", NULL, NULL, SW_SHOWNORMAL);
    }

    return 0;
}
