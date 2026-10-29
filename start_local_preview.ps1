$ErrorActionPreference = 'Stop'
$Root = [System.IO.Path]::GetFullPath($PSScriptRoot)
$Prefix = 'http://127.0.0.1:8765/'
$StartUrl = $Prefix + 'index.html'
$Listener = New-Object System.Net.HttpListener
$Listener.Prefixes.Add($Prefix)
$Mime = @{
  '.html'='text/html; charset=utf-8'; '.htm'='text/html; charset=utf-8';
  '.js'='application/javascript; charset=utf-8'; '.mjs'='application/javascript; charset=utf-8';
  '.css'='text/css; charset=utf-8'; '.json'='application/json; charset=utf-8';
  '.csv'='text/csv; charset=utf-8'; '.webmanifest'='application/manifest+json; charset=utf-8';
  '.svg'='image/svg+xml'; '.png'='image/png'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg';
  '.webp'='image/webp'; '.gif'='image/gif'; '.ico'='image/x-icon'; '.woff2'='font/woff2';
  '.txt'='text/plain; charset=utf-8'; '.xml'='application/xml; charset=utf-8'
}
try {
  $Listener.Start()
} catch {
  Write-Host 'Could not start the local HTTP server. Opening index.html directly as a fallback.'
  try { Start-Process (Join-Path $Root 'index.html') } catch { Write-Host 'Please open index.html from this folder manually.' }
  exit 0
}
Write-Host 'FRAME ATLAS 3.0 v13.28 local preview'
Write-Host ('Root: ' + $Root)
Write-Host ('Open: ' + $StartUrl)
Write-Host 'Press Ctrl+C in this window to stop the preview server.'
Start-Sleep -Milliseconds 350
Start-Process $StartUrl
try {
  while ($Listener.IsListening) {
    $Context = $Listener.GetContext()
    $Response = $Context.Response
    try {
      $RawPath = [Uri]::UnescapeDataString($Context.Request.Url.AbsolutePath.TrimStart('/'))
      if ([string]::IsNullOrWhiteSpace($RawPath)) { $RawPath = 'index.html' }
      $Candidate = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($Root, $RawPath.Replace('/', [System.IO.Path]::DirectorySeparatorChar)))
      $RootPrefix = $Root.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
      if (-not ($Candidate.Equals($Root, [System.StringComparison]::OrdinalIgnoreCase) -or $Candidate.StartsWith($RootPrefix, [System.StringComparison]::OrdinalIgnoreCase))) {
        $Response.StatusCode = 403
        $Body = [System.Text.Encoding]::UTF8.GetBytes('403 Forbidden')
      } elseif (-not (Test-Path -LiteralPath $Candidate -PathType Leaf)) {
        $Response.StatusCode = 404
        $Body = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
      } else {
        $Ext = [System.IO.Path]::GetExtension($Candidate).ToLowerInvariant()
        if ($Mime.ContainsKey($Ext)) { $Response.ContentType = $Mime[$Ext] } else { $Response.ContentType = 'application/octet-stream' }
        $Response.StatusCode = 200
        $Body = [System.IO.File]::ReadAllBytes($Candidate)
      }
      $Response.Headers['Cache-Control'] = 'no-store, no-cache, must-revalidate'
      $Response.Headers['Pragma'] = 'no-cache'
      $Response.ContentLength64 = $Body.LongLength
      if ($Context.Request.HttpMethod -ne 'HEAD' -and $Body.Length -gt 0) { $Response.OutputStream.Write($Body, 0, $Body.Length) }
    } catch {
      $Response.StatusCode = 500
      $Body = [System.Text.Encoding]::UTF8.GetBytes('500 Internal Server Error')
      try { $Response.ContentLength64 = $Body.LongLength; $Response.OutputStream.Write($Body, 0, $Body.Length) } catch {}
    } finally {
      try { $Response.OutputStream.Close() } catch {}
      try { $Response.Close() } catch {}
    }
  }
} finally {
  try { $Listener.Stop() } catch {}
  try { $Listener.Close() } catch {}
}
