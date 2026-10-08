// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Command, Child};
use std::sync::Mutex;
use tauri::State;

struct ServerState {
    child: Mutex<Option<Child>>,
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Start the Node.js server when the app starts
            let server_path = app.path_resolver()
                .resource_dir()
                .expect("failed to resolve resource directory")
                .join("server");
            
            let node_path = which::which("node").unwrap_or_else(|_| {
                // Fallback to common Node.js installation paths
                if cfg!(target_os = "windows") {
                    std::path::PathBuf::from("C:\\Program Files\\nodejs\\node.exe")
                } else {
                    std::path::PathBuf::from("/usr/bin/node")
                }
            });

            let server_script = server_path.join("dist").join("server.js");

            println!("Starting server with Node.js: {:?}", node_path);
            println!("Server script: {:?}", server_script);

            if server_script.exists() {
                match Command::new(&node_path)
                    .arg(&server_script)
                    .spawn()
                {
                    Ok(child) => {
                        println!("✅ Server started successfully!");
                        app.manage(ServerState {
                            child: Mutex::new(Some(child)),
                        });
                    }
                    Err(e) => {
                        eprintln!("❌ Failed to start server: {}", e);
                    }
                }
            } else {
                eprintln!("❌ Server script not found at: {:?}", server_script);
            }

            Ok(())
        })
        .on_window_event(|event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event.event() {
                // Clean up: kill the server process when window closes
                if let Some(state) = event.window().state::<ServerState>().try_lock() {
                    if let Ok(mut child_guard) = state.child.lock() {
                        if let Some(mut child) = child_guard.take() {
                            let _ = child.kill();
                            println!("🛑 Server stopped");
                        }
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
