import React, { useEffect } from 'react'
import { Head, usePage } from '@inertiajs/react'

type PageProps = {
  offerId: string
  jwt: string
  url: string
}

export default function TestCheckout() {
  const { props } = usePage<PageProps>()

  useEffect(() => {
    try {
      // Test: Add a button to DOM 1 second after page load to test MutationObserver
      setTimeout(() => {
        const testContainer = document.createElement('div')
        testContainer.id = 'mutation-test-container'
        testContainer.innerHTML = `
          <h3 class="text-lg font-semibold mb-2">MutationObserver Test</h3>
          <p class="text-sm text-gray-600 mb-3">These buttons were added to DOM after page load:</p>
          <div class="flex gap-2 flex-wrap">
            <button
              data-plandalf="present-offer"
              data-offer-id="${props.offerId}"
              data-embed-type="popup"
              data-size="small"
              data-env="test"
              data-customer="${props.jwt}"
              class="px-3 py-2 bg-blue-600 text-white rounded text-sm"
            >
              data-plandalf="present-offer" (Popup) sm (customer)
            </button>
            <button
              data-plandalf="present-offer"
              data-offer-id="${props.offerId}"
              data-embed-type="slider"
              data-size="medium"
              data-env="test"
              class="px-3 py-2 bg-green-600 text-white rounded text-sm"
            >
              data-plandalf="present-offer" (Slider)
            </button>
            <button
              data-numi-embed-type="popup"
              data-numi-offer="${props.offerId}"
              data-numi-popup-size="large"
              data-env="test"
              class="px-3 py-2 bg-purple-600 text-white rounded text-sm"
            >
              data-numi-embed-type="popup" lg
            </button>

          </div>
        `
        document.querySelector('.space-y-4')?.appendChild(testContainer)
        console.log('✅ Added mutation test buttons to DOM sx')

        // Also test manual re-scan
        setTimeout(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((window as any).plandalf?.initEmbeds) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(window as any).plandalf.initEmbeds(testContainer)
            console.log('✅ Called manual initEmbeds on test container')
          } else {
            console.log('⚠️ Manual initEmbeds API not available yet')
          }
        }, 300)
      }, 1000)

    } catch (error) {
      console.warn('Test checkout setup error:', error)
    }
  }, [props.jwt, props.offerId])

  const testUrl = `/o/${props.offerId}/test?customer=${props.jwt}`

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Head title="Dev: Test Checkout JWT" >
      <script src="/js/v1.js"></script>
      </Head>
      <h1 className="text-2xl font-semibold mb-4">Dev: Test Checkout with JWT</h1>
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <div className="text-sm text-yellow-800">
          <strong>🧪 Testing Unified SPA-Safe Initializer</strong>
          Watch console for MutationObserver logs. Buttons will appear below in 1 second.
        </div>
      </div>
      <pre className="text-xs">{JSON.stringify(props.payload,null,2)}</pre>

      <div className="w-full whitespace-pre-wrap overflow-ellipsis">
        <h4 className="text-lg font-medium">Test URL</h4>
        <a href={testUrl} className="text-blue-500 underline">{testUrl}</a>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-sm text-gray-500">Offer</div>
          <div className="font-mono text-sm">{props.offerId}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">JWT</div>
          <textarea readOnly value={props.jwt} className="w-full font-mono text-xs p-2 border rounded" rows={4} />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (window as any).plandalf?.presentOffer?.(props.offerId, { size: 'md', env: 'test', customer: props.jwt })
            }}
            className="px-4 py-2 bg-black text-white rounded"
          >Present Offer (Popup)</button>
          <span className="text-sm text-gray-500">JWT injected via plandalfConfig</span>
        </div>
        <div>
          <div className="text-sm text-gray-500">URL</div>
          <div className="font-mono text-xs break-all">{props.url}</div>
        </div>
      </div>

    </div>
  )
}


