for ($i=1; $i -le 20; $i++) {
    $p = "C:\Users\ASUS\AppData\Local\Google\Chrome\User Data\Profile $i\Preferences"
    if (Test-Path $p) {
        $c = Get-Content $p -Raw | ConvertFrom-Json
        if ($c.account_info) {
            foreach ($acc in $c.account_info) {
                if ($acc.email -like '*ayaanusmani*') {
                    Write-Host "Found in Profile $i : $($acc.email)"
                }
            }
        }
    }
}