(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INVALID-TITLE u101)
(define-constant ERR-INVALID-CONTENT-HASH u102)
(define-constant ERR-INVALID-TOKEN-COST u103)
(define-constant ERR-MODULE-ALREADY-EXISTS u104)
(define-constant ERR-MODULE-NOT-FOUND u105)
(define-constant ERR-PREREQUISITES-NOT-MET u106)
(define-constant ERR-INSUFFICIENT-TOKENS u107)
(define-constant ERR-INVALID-DIFFICULTY u108)
(define-constant ERR-MAX-MODULES-EXCEEDED u109)
(define-constant ERR-AUTHORITY-NOT-VERIFIED u110)

(define-data-var next-module-id uint u0)
(define-data-var max-modules uint u1000)
(define-data-var creation-fee uint u100)
(define-data-var authority-contract (optional principal) none)
(define-data-var literacy-token-contract principal 'SP000000000000000000002Q6VF78.byzantion-token)

(define-map modules
  uint
  { title: (string-ascii 100), content-hash: (buff 32), token-cost: uint, prerequisites: (list 5 uint), difficulty: uint, status: bool, creator: principal }
)

(define-map modules-by-title (string-ascii 100) uint)
(define-map module-unlocked { user: principal, module-id: uint } { unlocked: bool })

(define-read-only (get-module (id uint))
  (map-get? modules id)
)

(define-read-only (get-module-unlocked (user principal) (id uint))
  (map-get? module-unlocked { user: user, module-id: id })
)

(define-read-only (is-module-registered (title (string-ascii 100)))
  (is-some (map-get? modules-by-title title))
)

(define-private (validate-title (title (string-ascii 100)))
  (if (and (> (len title) u0) (<= (len title) u100)) (ok true) (err ERR-INVALID-TITLE))
)

(define-private (validate-content-hash (hash (buff 32)))
  (if (is-eq (len hash) u32) (ok true) (err ERR-INVALID-CONTENT-HASH))
)

(define-private (validate-token-cost (cost uint))
  (if (>= cost u0) (ok true) (err ERR-INVALID-TOKEN-COST))
)

(define-private (validate-prerequisites (prereqs (list 5 uint)))
  (if (<= (len prereqs) u5) (ok true) (err ERR-INVALID-PREREQUISITES))
)

(define-private (validate-difficulty (diff uint))
  (if (and (>= diff u1) (<= diff u5)) (ok true) (err ERR-INVALID-DIFFICULTY))
)

(define-private (check-prerequisites-met (user principal) (prereqs (list 5 uint)))
  (fold check-prereq prereqs (ok true))
)

(define-private (check-prereq (prereq uint) (acc (response bool uint)))
  (match acc
    ok-val (match (get-module-unlocked user prereq)
             unlocked-info (if (get unlocked unlocked-info) (ok true) (err ERR-PREREQUISITES_NOT-MET))
             (err ERR-PREREQUISITES_NOT-MET))
    err-val acc)
)

(define-public (set-authority-contract (contract-principal principal))
  (begin
    (asserts! (is-none (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set authority-contract (some contract-principal))
    (ok true)
  )
)

(define-public (create-module (title (string-ascii 100)) (content-hash (buff 32)) (token-cost uint) (prerequisites (list 5 uint)) (difficulty uint))
  (let ((next-id (var-get next-module-id)) (authority (var-get authority-contract)))
    (asserts! (< next-id (var-get max-modules)) (err ERR-MAX-MODULES-EXCEEDED))
    (try! (validate-title title))
    (try! (validate-content-hash content-hash))
    (try! (validate-token-cost token-cost))
    (try! (validate-prerequisites prerequisites))
    (try! (validate-difficulty difficulty))
    (asserts! (is-none (map-get? modules-by-title title)) (err ERR-MODULE-ALREADY-EXISTS))
    (try! (stx-transfer? (var-get creation-fee) tx-sender (unwrap! authority (err ERR-AUTHORITY-NOT-VERIFIED))))
    (map-set modules next-id { title: title, content-hash: content-hash, token-cost: token-cost, prerequisites: prerequisites, difficulty: difficulty, status: true, creator: tx-sender })
    (map-set modules-by-title title next-id)
    (var-set next-module-id (+ next-id u1))
    (ok next-id)
  )
)

(define-public (unlock-module (module-id uint))
  (let ((module-opt (map-get? modules module-id)) (user tx-sender))
    (match module-opt
      m (begin
          (try! (check-prerequisites-met user (get prerequisites m)))
          (let ((cost (get token-cost m)))
            (if (> cost u0) (try! (contract-call? (var-get literacy-token-contract) transfer cost user (as-contract tx-sender) none)) (ok true))
          )
          (map-set module-unlocked { user: user, module-id: module-id } { unlocked: true })
          (ok true)
        )
      (err ERR-MODULE_NOT-FOUND)
    )
  )
)

(define-public (deactivate-module (module-id uint))
  (let ((module (map-get? modules module-id)))
    (match module m (begin
                      (asserts! (is-eq (get creator m) tx-sender) (err ERR-NOT-AUTHORIZED))
                      (map-set modules module-id (merge m { status: false }))
                      (ok true))
                  (err ERR-MODULE_NOT-FOUND))
  )
)

(define-public (get-module-count)
  (ok (var-get next-module-id))
)