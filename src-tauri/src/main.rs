// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::net::TcpStream;
use std::path::{Path, PathBuf};
use std::process::{Child, Command};
use std::sync::Mutex;
use std::thread::sleep;
use std::time::Duration;
use tauri::Manager;

struct ServerState {
    child: Mutex<Option<Child>>,
}

fn is_port_listening(port: u16) -> bool {
    TcpStream::connect(format!("127.0.0.1:{}", port)).is_ok()
}

fn find_node_executable(exe_dir: &Path, resource_dir: &Path) -> Option<PathBuf> {
    let candidates = [
        exe_dir.join("node.exe"),
        exe_dir.join("bin").join("node.exe"),
        resource_dir.join("node.exe"),
        resource_dir.join("bin").join("node.exe"),
        resource_dir.join("resources").join("bin").join("node.exe"),
    ];

    for candidate in &candidates {
        if candidate.exists() {
            return Some(candidate.clone());
        }
    }

    if let Ok(path) = which::which("node") {
        return Some(path);
    }

    let standard_paths = [
        PathBuf::from("C:\\Program Files\\nodejs\\node.exe"),
        PathBuf::from("C:\\Program Files (x86)\\nodejs\\node.exe"),
    ];

    for path in &standard_paths {
        if path.exists() {
            return Some(path.clone());
        }
    }

    None
}

fn find_server_entry(exe_dir: &Path, resource_dir: &Path) -> Option<(PathBuf, PathBuf)> {
    let cwd = std::env::current_dir().unwrap_or_default();
    let candidates = [
        // Resources directory
        (resource_dir.join("server").join("dist").join("server.js"), resource_dir.join("server")),
        (resource_dir.join("dist").join("server.js"), resource_dir.to_path_buf()),
        (resource_dir.join("resources").join("server").join("dist").join("server.js"), resource_dir.join("resources").join("server")),
        // Exe directory
        (exe_dir.join("server").join("dist").join("server.js"), exe_dir.join("server")),
        (exe_dir.join("resources").join("server").join("dist").join("server.js"), exe_dir.join("resources").join("server")),
        // Cwd directory
        (cwd.join("server").join("dist").join("server.js"), cwd.join("server")),
        (cwd.join("dist").join("server.js"), cwd),
    ];

    for (script, dir) in candidates {
        if script.exists() {
            return Some((script, dir));
        }
    }

    None
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_handle = app.handle();
            let resource_dir = app_handle.path().resource_dir().unwrap_or_else(|_| PathBuf::from("."));
            let exe_dir = std::env::current_exe()
                .ok()
                .and_then(|p| p.parent().map(|p| p.to_path_buf()))
                .unwrap_or_else(|| PathBuf::from("."));

            println!("App directory: {:?}", exe_dir);
            println!("Resource directory: {:?}", resource_dir);

            let mut server_child: Option<Child> = None;

            if !is_port_listening(4000) {
                if let Some(node_exe) = find_node_executable(&exe_dir, &resource_dir) {
                    if let Some((server_script, working_dir)) = find_server_entry(&exe_dir, &resource_dir) {
                        println!("Starting backend with: {:?}", node_exe);
                        println!("Server entry: {:?}", server_script);
                        println!("Working directory: {:?}", working_dir);

                        let mut cmd = Command::new(&node_exe);
                        cmd.arg(&server_script)
                            .current_dir(&working_dir)
                            .env("PORT", "4000");

                        #[cfg(target_os = "windows")]
                        {
                            use std::os::windows::process::CommandExt;
                            const CREATE_NO_WINDOW: u32 = 0x08000000;
                            cmd.creation_flags(CREATE_NO_WINDOW);
                        }

                        match cmd.spawn() {
                            Ok(child) => {
                                println!("✅ Server spawned with PID: {}", child.id());
                                server_child = Some(child);

                                // Wait up to 6 seconds for port 4000
                                for _ in 0..60 {
                                    if is_port_listening(4000) {
                                        println!("✅ Backend listening on port 4000");
                                        break;
                                    }
                                    sleep(Duration::from_millis(100));
                                }
                            }
                            Err(e) => {
                                eprintln!("❌ Failed to spawn server: {}", e);
                            }
                        }
                    } else {
                        eprintln!("❌ Could not locate server script");
                    }
                } else {
                    eprintln!("❌ Could not locate Node.js binary");
                }
            } else {
                println!("✅ Port 4000 already active");
            }

            app.manage(ServerState {
                child: Mutex::new(server_child),
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                if let Some(state) = window.try_state::<ServerState>() {
                    let mut lock = state.child.lock().unwrap_or_else(|e| e.into_inner());
                    if let Some(mut child) = lock.take() {
                        let _ = child.kill();
                        println!("🛑 Server stopped");
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
