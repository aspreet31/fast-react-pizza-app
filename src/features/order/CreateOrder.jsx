import { Form, redirect, useActionData, useNavigation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import { createOrder } from "../../services/apiRestaurant";
import Button from "../../ui/Button";
import EmptyCart from '../cart/EmptyCart'
import {formatCurrency} from '../../utils/helpers'
import { clearCart, getCart, getTotalCartPrice } from "../cart/cartSlice";
import store from '../../store'
import { fetchAddress } from "../user/userSlice";
// https://uibakery.io/regex-library/phone-number
const isValidPhone = (str) =>
  /^\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/.test(
    str
  );


function CreateOrder() {
  const [withPriority, setWithPriority] = useState(false);
  const cart = useSelector(getCart);
  const totalPriceCart = useSelector(getTotalCartPrice);
  const priorityPrice = withPriority ? totalPriceCart*0.2 : 0;
  const totalPrice = totalPriceCart +priorityPrice;
  const navigation = useNavigation();
  const isSubmitting = navigation.state==="submitting";
  const formErrors = useActionData();
  const dispatch = useDispatch();
  const {username,
    status:addressStatus,
    position,
    address,
    error:errorAddress
  } = useSelector(state=>state.user);
  const isLoading = addressStatus==='loading';
  if(!cart.length) return <EmptyCart/>
  return (
    <div className="px-4 py-6">
      <h2 className="mb-8 text-xl font-semibold">Ready to order? Let's go!</h2>

      <Form method="POST">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="sm:basis-40">First Name</label>
          <input type="text" name="customer" required className="input w-full" defaultValue={username}/>
        </div>

        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label  className="sm:basis-40">Phone number</label>
          <div className="grow">
            <input type="tel" name="phone" required className="input w-full"/>
            {formErrors?.phone && <p className="mt-2 bg-red-100 text-xs text-red-700 p-2 rounded-md">{formErrors.phone}</p>}
          </div>
        </div>

        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center relative ">
          <label  className="sm:basis-40">Address</label>
          <div className="grow">
            <input type="text" name="address" disabled={isLoading} defaultValue={address} required className="input w-full" />
            {addressStatus==='error' && <p className="mt-2 bg-red-100 text-xs text-red-700 p-2 rounded-md">{errorAddress}</p>}
          </div>
         {!position.latitue && !position.longitude &&(<span className="absolute right-[3px] top-[3px] z-50 md:right-[5px] md:top-[5px] ">
          <Button type='small'disabled={isLoading} onClick={(e)=> {
            e.preventDefault();
            dispatch(fetchAddress())}}>get position</Button>
          </span>)}
        </div>

        <div className="mb-12 flex items-center gap-5  ">
          <input
            type="checkbox"
            name="priority"
            id="priority"
            className="h-6 w-6 accent-yellow-400 focus:outline-none focus:ring focus:ring-yellow-400 focus:ring-offset-2 "
            value={withPriority}
            onChange={(e) => setWithPriority(e.target.checked)}
          />
          <label htmlFor="priority" className="font-medium">Want to yo give your order priority?</label>
        </div>

        <div>
          <input name="cart" type="hidden" value={JSON.stringify(cart)}/>
          <input name="position" type="hidden" value={ position.longitude && position.latitude ?`${position.latitude},${position.longitude}` :''}/>
          <Button disabled={isSubmitting || isLoading} type="primary">{ isSubmitting ? "placing order..." : `Order now  from ${formatCurrency(totalPrice)}`}</Button>
        </div>
      </Form>
    </div>
  );
}

export async function action({request}) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  const order ={
    ...data,cart:JSON.parse(data.cart),
    priority:data.priority==="true",
  }

  const errors={};
  if(!isValidPhone(order.phone)) {
    errors.phone="Please give usyour correct phone number.We might need to contact you";
  }
  if(Object.keys(errors).length>0) return errors;
  const newOrder = await createOrder(order)
  //not overuse
 store.dispatch(clearCart())
  return redirect(`/order/${newOrder.id}`)

}
export default CreateOrder;
