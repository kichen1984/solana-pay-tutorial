import { useRef } from "react";
import { products } from "../lib/products"
import NumberInput from "./NumberInput";


interface Props {
  submitTarget: string;
  enabled: boolean;
}

export default function Products({ submitTarget, enabled }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form method='get' action={submitTarget} ref={formRef}>
      <div className='flex flex-col gap-16 items-stretch m-12 self-center'>
        <div className="grid grid-flow-row auto-rows-max gap-4 place-content-evenly">
          {products.map(product => {
            return (
              <div className="rounded-xl bg-[#f7f7fb] text-left p-6 shadow-lg" key={product.id}>
                <div className="md:flex items-center justify-between">
                <h3 className="text-2xl font-semibold leading-6 text-gray-800">{product.name}</h3>
                <ul className="text-2xl font-semibold md:mt-0 mt-4 leading-6 text-[#0f0f0f]">
                    <div className="bg-[#f9f7ff] p-2 rounded-lg">
                    <li>{product.featureOne}</li>
                    </div>
                  </ul>
                  </div>
                <p className="md:w-80 text-base leading-6 mt-6 text-gray-600">{product.description}</p>
                <p className="my-4">
                  <span className="mt-4 text-xl font-bold">{product.priceSol} SOL</span>
                  {product.unitName && <span className="text-sm text-[#202021]"> /{product.unitName}</span>}
                </p>
                <div className="mt-1">
                  <NumberInput name={product.id} formRef={formRef} />
                </div>
              </div>
            )
          })}

        </div>

        <button
          className="items-center px-20 rounded-md py-2 max-w-fit self-center font-bold bg-[#202021] text-white hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!enabled}
        >
          Checkout
        </button>
      </div>
    </form>
  )
}
